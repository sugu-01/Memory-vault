package com.memoryvault.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReminderRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Remind-at time is required")
    private LocalDateTime remindAt;

    private String repeatType = "NONE";
    private Long taskId;
}
