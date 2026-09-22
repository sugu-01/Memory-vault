package com.memoryvault.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalResponse {
    private Long id;
    private Long userId;
    private String title;
    private String description;
    private String status;
    private Integer progress;
    private LocalDate startDate;
    private LocalDate targetDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private java.util.List<ProcessResponse> processes;
}
