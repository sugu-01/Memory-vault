package com.memoryvault.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.memoryvault.entity.User;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final UserRepository userRepository;
    private final MemoryRepository memoryRepository;
    private final TaskRepository taskRepository;
    private final ReminderRepository reminderRepository;
    private final GoalRepository goalRepository;
    private final ProcessRepository processRepository;
    private final ProgressLogRepository progressLogRepository;
    private final EvaluationRepository evaluationRepository;
    private final TagRepository tagRepository;
    private final AiExtractionRepository aiExtractionRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Map<String, Object> exportAllData(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Map<String, Object> exportData = new LinkedHashMap<>();
        exportData.put("exportVersion", "1.0");
        exportData.put("exportedAt", java.time.LocalDateTime.now().toString());
        exportData.put("user", Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "displayName", user.getDisplayName() != null ? user.getDisplayName() : "",
                "createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""
        ));
        exportData.put("memories", memoryRepository.findByUserIdAndDeletedFalseOrderByMemoryDateDesc(userId));
        exportData.put("tasks", taskRepository.findByUserIdAndDeletedFalse(userId));
        exportData.put("reminders", reminderRepository.findByUserIdAndDeletedFalse(userId));
        exportData.put("goals", goalRepository.findByUserIdAndDeletedFalse(userId));
        exportData.put("processes", processRepository.findByUserIdAndDeletedFalse(userId));
        exportData.put("progressLogs", progressLogRepository.findByUserId(userId));
        exportData.put("evaluations", evaluationRepository.findByUserIdAndDeletedFalse(userId));
        exportData.put("tags", tagRepository.findByUserId(userId));
        exportData.put("aiExtractions", aiExtractionRepository.findByUserId(userId));

        return exportData;
    }

    @Transactional(readOnly = true)
    public String exportMemoriesCsv(Long userId) {
        StringBuilder csv = new StringBuilder();
        csv.append("id,title,mood,isImportant,memoryDate,createdAt\n");
        memoryRepository.findByUserIdAndDeletedFalseOrderByMemoryDateDesc(userId).forEach(m -> {
            csv.append(escapeCsv(String.valueOf(m.getId()))).append(",");
            csv.append(escapeCsv(m.getTitle() != null ? m.getTitle() : "")).append(",");
            csv.append(escapeCsv(m.getMood() != null ? m.getMood() : "")).append(",");
            csv.append(m.getIsImportant()).append(",");
            csv.append(m.getMemoryDate()).append(",");
            csv.append(m.getCreatedAt()).append("\n");
        });
        return csv.toString();
    }

    @Transactional(readOnly = true)
    public String exportTasksCsv(Long userId) {
        StringBuilder csv = new StringBuilder();
        csv.append("id,title,status,priority,dueDate,completedAt,createdAt\n");
        taskRepository.findByUserIdAndDeletedFalse(userId).forEach(t -> {
            csv.append(t.getId()).append(",");
            csv.append(escapeCsv(t.getTitle())).append(",");
            csv.append(t.getStatus()).append(",");
            csv.append(t.getPriority()).append(",");
            csv.append(t.getDueDate() != null ? t.getDueDate() : "").append(",");
            csv.append(t.getCompletedAt() != null ? t.getCompletedAt() : "").append(",");
            csv.append(t.getCreatedAt()).append("\n");
        });
        return csv.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
