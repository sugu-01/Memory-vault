package com.memoryvault.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TaskRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private LocalDate dueDate;
    private String status = "PENDING";
    private String priority = "MEDIUM";
    private Long memoryId;
}
