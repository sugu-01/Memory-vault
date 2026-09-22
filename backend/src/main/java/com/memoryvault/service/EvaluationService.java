package com.memoryvault.service;

import com.memoryvault.dto.request.EvaluationRequest;
import com.memoryvault.entity.Evaluation;
import com.memoryvault.exception.ForbiddenException;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.EvaluationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;

    @Transactional
    public Evaluation create(Long userId, EvaluationRequest req) {
        Evaluation eval = Evaluation.builder()
                .userId(userId)
                .periodType(Evaluation.PeriodType.valueOf(req.getPeriodType().toUpperCase()))
                .periodStart(req.getPeriodStart())
                .periodEnd(req.getPeriodEnd())
                .summary(req.getSummary())
                .achievements(req.getAchievements())
                .improvements(req.getImprovements())
                .score(req.getScore())
                .aiGenerated(false)
                .build();
        return evaluationRepository.save(eval);
    }

    @Transactional(readOnly = true)
    public List<Evaluation> findAll(Long userId, String periodType) {
        if (periodType != null) {
            Evaluation.PeriodType pt = Evaluation.PeriodType.valueOf(periodType.toUpperCase());
            return evaluationRepository.findByUserIdAndPeriodTypeAndDeletedFalse(userId, pt);
        }
        return evaluationRepository.findByUserIdAndDeletedFalseOrderByPeriodStartDesc(userId);
    }

    @Transactional(readOnly = true)
    public Evaluation findById(Long userId, Long id) {
        return getOwned(userId, id);
    }

    @Transactional
    public Evaluation update(Long userId, Long id, EvaluationRequest req) {
        Evaluation eval = getOwned(userId, id);
        eval.setSummary(req.getSummary());
        eval.setAchievements(req.getAchievements());
        eval.setImprovements(req.getImprovements());
        eval.setScore(req.getScore());
        return evaluationRepository.save(eval);
    }

    @Transactional
    public void softDelete(Long userId, Long id) {
        Evaluation eval = getOwned(userId, id);
        eval.setDeleted(true);
        evaluationRepository.save(eval);
    }

    private Evaluation getOwned(Long userId, Long id) {
        Evaluation eval = evaluationRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found"));
        if (!eval.getUserId().equals(userId)) throw new ForbiddenException("Access denied");
        return eval;
    }
}
