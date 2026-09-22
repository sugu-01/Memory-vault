package com.memoryvault.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.memoryvault.entity.AiExtraction;
import com.memoryvault.entity.Memory;
import com.memoryvault.repository.AiExtractionRepository;
import com.memoryvault.repository.MemoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final AiExtractionRepository aiExtractionRepository;
    private final MemoryRepository memoryRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.gemini.api-url}")
    private String geminiApiUrl;

    /**
     * Asynchronously analyzes a memory entry using Gemini AI.
     * If AI fails, the original diary entry remains intact.
     * This method NEVER throws exceptions that could affect the caller.
     */
    @Async
    @Transactional
    public void analyzeMemoryAsync(Long memoryId, Long userId) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.info("Gemini API key not configured, skipping AI analysis for memory {}", memoryId);
            return;
        }

        // Create a PENDING extraction record first
        AiExtraction extraction = AiExtraction.builder()
                .userId(userId)
                .memoryId(memoryId)
                .processingStatus(AiExtraction.ProcessingStatus.PROCESSING)
                .build();
        extraction = aiExtractionRepository.save(extraction);

        try {
            Memory memory = memoryRepository.findByIdAndUserIdAndDeletedFalse(memoryId, userId).orElse(null);
            if (memory == null) {
                log.warn("Memory {} not found for AI analysis", memoryId);
                updateExtractionFailed(extraction, "Memory not found");
                return;
            }

            String prompt = buildAnalysisPrompt(memory.getOriginalContent());
            String response = callGeminiApi(prompt);

            if (response == null) {
                updateExtractionFailed(extraction, "Empty response from AI");
                return;
            }

            parseAndSaveExtraction(extraction, response);
            log.info("AI analysis completed for memory {}", memoryId);

        } catch (Exception e) {
            log.error("AI analysis failed for memory {}: {}", memoryId, e.getMessage());
            updateExtractionFailed(extraction, e.getMessage());
            // The original memory is safe — this is a fire-and-forget operation
        }
    }

    public String chat(String message, List<Map<String, String>> history, Long userId) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return "AI assistant is not configured. Please add your Gemini API key to the application configuration.";
        }

        try {
            StringBuilder contextBuilder = new StringBuilder();
            contextBuilder.append("You are a helpful personal assistant for the Memory Vault app. ");
            contextBuilder.append("Help the user manage their diary entries, tasks, goals, and reminders. ");
            contextBuilder.append("Be concise, empathetic, and supportive.\n\n");
            contextBuilder.append("User message: ").append(message);

            String response = callGeminiApi(contextBuilder.toString());
            return response != null ? response : "I couldn't process your request. Please try again.";
        } catch (Exception e) {
            log.error("AI chat failed: {}", e.getMessage());
            return "AI assistant is temporarily unavailable. Please try again later.";
        }
    }

    public Optional<AiExtraction> getExtraction(Long memoryId, Long userId) {
        return aiExtractionRepository.findByMemoryIdAndUserId(memoryId, userId);
    }

    private String buildAnalysisPrompt(String content) {
        return "Analyze the following diary entry and extract structured information. " +
               "Respond ONLY with a valid JSON object, no markdown, no extra text.\n\n" +
               "Diary entry:\n" + content + "\n\n" +
               "Required JSON format:\n" +
               "{\n" +
               "  \"importantPoints\": \"bullet-point list of key things to remember\",\n" +
               "  \"extractedTasks\": \"tasks mentioned or implied that need doing\",\n" +
               "  \"extractedReminders\": \"time-sensitive things to remember\",\n" +
               "  \"extractedGoals\": \"goals or aspirations mentioned\",\n" +
               "  \"keywords\": \"comma-separated keywords\",\n" +
               "  \"sentiment\": \"POSITIVE, NEGATIVE, NEUTRAL, or MIXED\"\n" +
               "}";
    }

    private String callGeminiApi(String prompt) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));
            requestBody.put("contents", List.of(content));

            String url = geminiApiUrl + "?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            String responseBody = response.getBody();

            if (responseBody == null) return null;

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode text = candidates.get(0).path("content").path("parts").get(0).path("text");
                return text.asText();
            }
            return null;
        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
            return null;
        }
    }

    private void parseAndSaveExtraction(AiExtraction extraction, String responseText) {
        try {
            // Try to extract JSON from response (remove markdown code fences if present)
            String json = responseText.trim();
            if (json.startsWith("```")) {
                int start = json.indexOf('{');
                int end = json.lastIndexOf('}');
                if (start >= 0 && end > start) {
                    json = json.substring(start, end + 1);
                }
            }

            JsonNode parsed = objectMapper.readTree(json);
            extraction.setImportantPoints(parsed.path("importantPoints").asText(null));
            extraction.setExtractedTasks(parsed.path("extractedTasks").asText(null));
            extraction.setExtractedReminders(parsed.path("extractedReminders").asText(null));
            extraction.setExtractedGoals(parsed.path("extractedGoals").asText(null));
            extraction.setKeywords(parsed.path("keywords").asText(null));
            extraction.setSentiment(parsed.path("sentiment").asText(null));
            extraction.setProcessingStatus(AiExtraction.ProcessingStatus.COMPLETED);
        } catch (Exception e) {
            log.warn("Could not parse AI response as JSON, saving raw text");
            extraction.setImportantPoints(responseText);
            extraction.setProcessingStatus(AiExtraction.ProcessingStatus.COMPLETED);
        }
        aiExtractionRepository.save(extraction);
    }

    private void updateExtractionFailed(AiExtraction extraction, String errorMessage) {
        extraction.setProcessingStatus(AiExtraction.ProcessingStatus.FAILED);
        extraction.setErrorMessage(errorMessage);
        aiExtractionRepository.save(extraction);
    }
}
