package com.memoryvault.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ProgressLogRequest {
    private Long goalId;
    private Long processId;
    private String note;
    private Integer progressValue;

    @NotNull(message = "Log date is required")
    private LocalDate logDate;
}
