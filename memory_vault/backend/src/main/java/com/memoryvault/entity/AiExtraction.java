package com.memoryvault.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_extractions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiExtraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "memory_id", nullable = false)
    private Long memoryId;

    @Column(name = "important_points", columnDefinition = "TEXT")
    private String importantPoints;

    @Column(name = "extracted_tasks", columnDefinition = "TEXT")
    private String extractedTasks;

    @Column(name = "extracted_reminders", columnDefinition = "TEXT")
    private String extractedReminders;

    @Column(name = "extracted_goals", columnDefinition = "TEXT")
    private String extractedGoals;

    @Column(columnDefinition = "TEXT")
    private String keywords;

    @Column(length = 20)
    private String sentiment;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", nullable = false, length = 20)
    @Builder.Default
    private ProcessingStatus processingStatus = ProcessingStatus.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum ProcessingStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }
}
