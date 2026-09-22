package com.memoryvault.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EvaluationRequest {
    @NotBlank(message = "Period type is required")
    private String periodType;

    @NotNull(message = "Period start date is required")
    private LocalDate periodStart;

    @NotNull(message = "Period end date is required")
    private LocalDate periodEnd;

    private String summary;
    private String achievements;
    private String improvements;

    @Min(1) @Max(10)
    private Integer score;
}
