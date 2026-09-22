package com.memoryvault.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TaskQuickActionRequest {
    @NotBlank(message = "Action is required")
    private String action; // DONE, TOMORROW, SKIP
}
