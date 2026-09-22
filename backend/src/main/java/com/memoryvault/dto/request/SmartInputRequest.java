package com.memoryvault.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SmartInputRequest {
    @NotBlank(message = "Text cannot be empty")
    private String text;

    private LocalDate date;
}
