package com.memoryvault.service;

import com.memoryvault.dto.request.ProgressLogRequest;
import com.memoryvault.entity.ProgressLog;
import com.memoryvault.exception.ForbiddenException;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.ProgressLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final ProgressLogRepository progressLogRepository;

    @Transactional
    public ProgressLog create(Long userId, ProgressLogRequest req) {
        ProgressLog log = ProgressLog.builder()
                .userId(userId)
                .goalId(req.getGoalId())
                .processId(req.getProcessId())
                .note(req.getNote())
                .progressValue(req.getProgressValue())
                .logDate(req.getLogDate())
                .build();
        return progressLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<ProgressLog> findAll(Long userId, Long goalId, Long processId) {
        if (goalId != null) return progressLogRepository.findByUserIdAndGoalId(userId, goalId);
        if (processId != null) return progressLogRepository.findByUserIdAndProcessId(userId, processId);
        return progressLogRepository.findByUserId(userId);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        ProgressLog log = progressLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Progress log not found"));
        if (!log.getUserId().equals(userId)) throw new ForbiddenException("Access denied");
        progressLogRepository.delete(log);
    }
}
