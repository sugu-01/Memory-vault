package com.memoryvault.repository;

import com.memoryvault.entity.AiExtraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiExtractionRepository extends JpaRepository<AiExtraction, Long> {
    Optional<AiExtraction> findByMemoryIdAndUserId(Long memoryId, Long userId);
    Optional<AiExtraction> findTopByMemoryIdOrderByCreatedAtDesc(Long memoryId);
    java.util.List<AiExtraction> findByUserId(Long userId);
}
