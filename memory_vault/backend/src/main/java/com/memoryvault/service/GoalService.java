package com.memoryvault.service;

import com.memoryvault.dto.request.GoalRequest;
import com.memoryvault.dto.request.ProcessRequest;
import com.memoryvault.dto.response.GoalResponse;
import com.memoryvault.dto.response.ProcessResponse;
import com.memoryvault.entity.Goal;
import com.memoryvault.entity.Process;
import com.memoryvault.exception.ForbiddenException;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.GoalRepository;
import com.memoryvault.repository.ProcessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final ProcessRepository processRepository;

    @Transactional
    public GoalResponse createGoal(Long userId, GoalRequest req) {
        Goal goal = Goal.builder()
                .userId(userId)
                .title(req.getTitle())
                .description(req.getDescription())
                .status(req.getStatus() != null ? req.getStatus() : "ACTIVE")
                .progress(req.getProgress() != null ? req.getProgress() : 0)
                .startDate(req.getStartDate())
                .targetDate(req.getTargetDate())
                .build();
        return toGoalResponse(goalRepository.save(goal));
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> findAllGoals(Long userId) {
        return goalRepository.findByUserIdAndDeletedFalse(userId)
                .stream().map(this::toGoalResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GoalResponse findGoalById(Long userId, Long id) {
        return toGoalResponse(getOwnedGoal(userId, id));
    }

    @Transactional
    public GoalResponse updateGoal(Long userId, Long id, GoalRequest req) {
        Goal goal = getOwnedGoal(userId, id);
        goal.setTitle(req.getTitle());
        goal.setDescription(req.getDescription());
        if (req.getStatus() != null) goal.setStatus(req.getStatus());
        if (req.getProgress() != null) goal.setProgress(req.getProgress());
        goal.setStartDate(req.getStartDate());
        goal.setTargetDate(req.getTargetDate());
        return toGoalResponse(goalRepository.save(goal));
    }

    @Transactional
    public void softDeleteGoal(Long userId, Long id) {
        Goal goal = getOwnedGoal(userId, id);
        goal.setDeleted(true);
        goalRepository.save(goal);
    }

    // --- Processes ---

    @Transactional
    public ProcessResponse createProcess(Long userId, Long goalId, ProcessRequest req) {
        // Validate goal ownership if goalId provided
        if (goalId != null) getOwnedGoal(userId, goalId);
        Process process = Process.builder()
                .userId(userId)
                .goalId(goalId)
                .title(req.getTitle())
                .description(req.getDescription())
                .status(req.getStatus() != null ? req.getStatus() : "ACTIVE")
                .progress(req.getProgress() != null ? req.getProgress() : 0)
                .orderIndex(req.getOrderIndex() != null ? req.getOrderIndex() : 0)
                .build();
        return toProcessResponse(processRepository.save(process));
    }

    @Transactional(readOnly = true)
    public List<ProcessResponse> findProcessesByGoal(Long userId, Long goalId) {
        getOwnedGoal(userId, goalId);
        return processRepository.findByGoalIdAndDeletedFalseOrderByOrderIndexAsc(goalId)
                .stream().map(this::toProcessResponse).collect(Collectors.toList());
    }

    @Transactional
    public ProcessResponse updateProcess(Long userId, Long goalId, Long processId, ProcessRequest req) {
        if (goalId != null) getOwnedGoal(userId, goalId);
        Process process = getOwnedProcess(userId, processId);
        process.setTitle(req.getTitle());
        process.setDescription(req.getDescription());
        if (req.getStatus() != null) process.setStatus(req.getStatus());
        if (req.getProgress() != null) process.setProgress(req.getProgress());
        if (req.getOrderIndex() != null) process.setOrderIndex(req.getOrderIndex());
        return toProcessResponse(processRepository.save(process));
    }

    @Transactional
    public void softDeleteProcess(Long userId, Long goalId, Long processId) {
        Process process = getOwnedProcess(userId, processId);
        process.setDeleted(true);
        processRepository.save(process);
    }

    private Goal getOwnedGoal(Long userId, Long goalId) {
        Goal goal = goalRepository.findByIdAndDeletedFalse(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
        if (!goal.getUserId().equals(userId)) throw new ForbiddenException("Access denied");
        return goal;
    }

    private Process getOwnedProcess(Long userId, Long processId) {
        Process process = processRepository.findByIdAndDeletedFalse(processId)
                .orElseThrow(() -> new ResourceNotFoundException("Process not found"));
        if (!process.getUserId().equals(userId)) throw new ForbiddenException("Access denied");
        return process;
    }

    public GoalResponse toGoalResponse(Goal g) {
        List<ProcessResponse> processes = processRepository
                .findByGoalIdAndDeletedFalseOrderByOrderIndexAsc(g.getId())
                .stream().map(this::toProcessResponse).collect(Collectors.toList());
        return GoalResponse.builder()
                .id(g.getId())
                .userId(g.getUserId())
                .title(g.getTitle())
                .description(g.getDescription())
                .status(g.getStatus())
                .progress(g.getProgress())
                .startDate(g.getStartDate())
                .targetDate(g.getTargetDate())
                .createdAt(g.getCreatedAt())
                .updatedAt(g.getUpdatedAt())
                .processes(processes)
                .build();
    }

    public ProcessResponse toProcessResponse(Process p) {
        return ProcessResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .goalId(p.getGoalId())
                .title(p.getTitle())
                .description(p.getDescription())
                .status(p.getStatus())
                .progress(p.getProgress())
                .orderIndex(p.getOrderIndex())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
