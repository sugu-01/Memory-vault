package com.memoryvault.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessResponse {
    private Long id;
    private Long userId;
    private Long goalId;
    private String title;
    private String description;
    private String status;
    private Integer progress;
    private Integer orderIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
