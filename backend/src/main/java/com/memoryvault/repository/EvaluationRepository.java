package com.memoryvault.repository;

import com.memoryvault.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    List<Evaluation> findByUserIdAndDeletedFalseOrderByPeriodStartDesc(Long userId);
    Optional<Evaluation> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);
    Optional<Evaluation> findByIdAndDeletedFalse(Long id);
    List<Evaluation> findByUserIdAndPeriodTypeAndDeletedFalse(Long userId, Evaluation.PeriodType periodType);
    Optional<Evaluation> findByUserIdAndPeriodTypeAndPeriodStartAndDeletedFalse(
            Long userId, Evaluation.PeriodType periodType, LocalDate periodStart);
    List<Evaluation> findByUserIdAndDeletedFalse(Long userId);
}
