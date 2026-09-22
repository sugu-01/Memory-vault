package com.memoryvault.controller;

import com.memoryvault.dto.request.AiChatRequest;
import com.memoryvault.dto.response.ApiResponse;
import com.memoryvault.entity.AiExtraction;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.UserRepository;
import com.memoryvault.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final UserRepository userRepository;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<Map<String, String>>> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AiChatRequest req) {
        Long userId = getUserId(userDetails);
        String reply = aiService.chat(req.getMessage(), req.getConversationHistory(), userId);
        return ResponseEntity.ok(ApiResponse.success("OK", Map.of("reply", reply)));
    }

    @PostMapping("/analyze/{memoryId}")
    public ResponseEntity<ApiResponse<String>> analyzeMemory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long memoryId) {
        Long userId = getUserId(userDetails);
        aiService.analyzeMemoryAsync(memoryId, userId);
        return ResponseEntity.ok(ApiResponse.success("AI analysis scheduled", "Processing"));
    }

    @GetMapping("/extraction/{memoryId}")
    public ResponseEntity<ApiResponse<AiExtraction>> getExtraction(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long memoryId) {
        Long userId = getUserId(userDetails);
        AiExtraction extraction = aiService.getExtraction(memoryId, userId).orElse(null);
        return ResponseEntity.ok(ApiResponse.success("OK", extraction));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found")).getId();
    }
}
