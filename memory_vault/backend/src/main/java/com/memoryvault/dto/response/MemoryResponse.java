package com.memoryvault.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemoryResponse {
    private Long id;
    private Long userId;
    private String title;
    private String originalContent;
    private String mood;
    private Boolean isImportant;
    private LocalDate memoryDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Set<TagResponse> tags;
}
