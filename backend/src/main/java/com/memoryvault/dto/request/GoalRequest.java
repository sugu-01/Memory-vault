package com.memoryvault.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class GoalRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String status = "ACTIVE";
    private Integer progress = 0;
    private LocalDate startDate;
    private LocalDate targetDate;
}
