package com.memoryvault.service;

import com.memoryvault.dto.request.TaskRequest;
import com.memoryvault.dto.response.TaskResponse;
import com.memoryvault.entity.Task;
import com.memoryvault.exception.ForbiddenException;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;

    @Transactional
    public TaskResponse create(Long userId, TaskRequest req) {
        Task task = Task.builder()
                .userId(userId)
                .memoryId(req.getMemoryId())
                .title(req.getTitle())
                .description(req.getDescription())
                .dueDate(req.getDueDate())
                .status(parseStatus(req.getStatus()))
                .priority(parsePriority(req.getPriority()))
                .build();
        task = taskRepository.save(task);
        return toResponse(task);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findAll(Long userId, String status, Long memoryId) {
        if (status != null) {
            Task.TaskStatus ts = parseStatus(status);
            return taskRepository.findByUserIdAndStatusAndDeletedFalse(userId, ts)
                    .stream().map(this::toResponse).collect(Collectors.toList());
        }
        if (memoryId != null) {
            return taskRepository.findByUserIdAndMemoryIdAndDeletedFalse(userId, memoryId)
                    .stream().map(this::toResponse).collect(Collectors.toList());
        }
        return taskRepository.findByUserIdAndDeletedFalse(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskResponse findById(Long userId, Long id) {
        return toResponse(getOwned(userId, id));
    }

    @Transactional
    public TaskResponse update(Long userId, Long id, TaskRequest req) {
        Task task = getOwned(userId, id);
        task.setTitle(req.getTitle());
        task.setDescription(req.getDescription());
        task.setDueDate(req.getDueDate());
        task.setPriority(parsePriority(req.getPriority()));
        updateStatus(task, parseStatus(req.getStatus()));
        task = taskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public TaskResponse updateStatus(Long userId, Long id, String status) {
        Task task = getOwned(userId, id);
        updateStatus(task, parseStatus(status));
        task = taskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public void softDelete(Long userId, Long id) {
        Task task = getOwned(userId, id);
        task.setDeleted(true);
        taskRepository.save(task);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findUpcoming(Long userId, int limit) {
        return taskRepository.findByUserIdAndDeletedFalseAndStatusNotOrderByDueDateAsc(
                userId, Task.TaskStatus.COMPLETED)
                .stream().limit(limit).map(this::toResponse).collect(Collectors.toList());
    }

    private Task getOwned(Long userId, Long id) {
        Task task = taskRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if (!task.getUserId().equals(userId)) throw new ForbiddenException("Access denied");
        return task;
    }

    private void updateStatus(Task task, Task.TaskStatus newStatus) {
        task.setStatus(newStatus);
        if (newStatus == Task.TaskStatus.COMPLETED && task.getCompletedAt() == null) {
            task.setCompletedAt(LocalDateTime.now());
        } else if (newStatus != Task.TaskStatus.COMPLETED) {
            task.setCompletedAt(null);
        }
    }

    private Task.TaskStatus parseStatus(String s) {
        if (s == null) return Task.TaskStatus.PENDING;
        try { return Task.TaskStatus.valueOf(s.toUpperCase()); }
        catch (Exception e) { return Task.TaskStatus.PENDING; }
    }

    private Task.Priority parsePriority(String p) {
        if (p == null) return Task.Priority.MEDIUM;
        try { return Task.Priority.valueOf(p.toUpperCase()); }
        catch (Exception e) { return Task.Priority.MEDIUM; }
    }

    public TaskResponse toResponse(Task t) {
        return TaskResponse.builder()
                .id(t.getId())
                .userId(t.getUserId())
                .memoryId(t.getMemoryId())
                .title(t.getTitle())
                .description(t.getDescription())
                .dueDate(t.getDueDate())
                .status(t.getStatus().name())
                .priority(t.getPriority().name())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .completedAt(t.getCompletedAt())
                .build();
    }
}
