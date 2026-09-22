package com.memoryvault.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProcessRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String status = "ACTIVE";
    private Integer progress = 0;
    private Integer orderIndex = 0;
    private Long goalId;
}
