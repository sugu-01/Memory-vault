package com.memoryvault.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class AiChatRequest {
    @NotBlank(message = "Message is required")
    private String message;

    private List<Map<String, String>> conversationHistory;
}
