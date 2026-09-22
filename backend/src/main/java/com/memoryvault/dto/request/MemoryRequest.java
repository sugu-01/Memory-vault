package com.memoryvault.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class MemoryRequest {
    @Size(max = 255)
    private String title;

    @NotBlank(message = "Content is required")
    private String originalContent;

    @Size(max = 50)
    private String mood;

    private Boolean isImportant = false;

    @NotNull(message = "Memory date is required")
    private LocalDate memoryDate;

    private Set<Long> tagIds;
}
