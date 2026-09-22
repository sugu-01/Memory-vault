package com.memoryvault.service;

import com.memoryvault.dto.request.ReminderRequest;
import com.memoryvault.dto.response.ReminderResponse;
import com.memoryvault.entity.Reminder;
import com.memoryvault.entity.ReminderHistory;
import com.memoryvault.exception.ForbiddenException;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.ReminderHistoryRepository;
import com.memoryvault.repository.ReminderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final ReminderHistoryRepository reminderHistoryRepository;

    @Transactional
    public ReminderResponse create(Long userId, ReminderRequest req) {
        Reminder reminder = Reminder.builder()
                .userId(userId)
                .taskId(req.getTaskId())
                .title(req.getTitle())
                .description(req.getDescription())
                .remindAt(req.getRemindAt())
                .repeatType(req.getRepeatType() != null ? req.getRepeatType() : "NONE")
                .isActive(true)
                .build();
        return toResponse(reminderRepository.save(reminder));
    }

    @Transactional(readOnly = true)
    public List<ReminderResponse> findAll(Long userId) {
        return reminderRepository.findByUserIdAndDeletedFalse(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReminderResponse findById(Long userId, Long id) {
        return toResponse(getOwned(userId, id));
    }

    @Transactional
    public ReminderResponse update(Long userId, Long id, ReminderRequest req) {
        Reminder reminder = getOwned(userId, id);
        reminder.setTitle(req.getTitle());
        reminder.setDescription(req.getDescription());
        reminder.setRemindAt(req.getRemindAt());
        reminder.setRepeatType(req.getRepeatType() != null ? req.getRepeatType() : "NONE");
        reminder.setTaskId(req.getTaskId());
        return toResponse(reminderRepository.save(reminder));
    }

    @Transactional
    public void softDelete(Long userId, Long id) {
        Reminder reminder = getOwned(userId, id);
        reminder.setDeleted(true);
        reminderRepository.save(reminder);
    }

    @Transactional(readOnly = true)
    public List<ReminderHistory> getHistory(Long userId, Long reminderId) {
        Reminder reminder = getOwned(userId, reminderId);
        return reminderHistoryRepository.findByReminderIdAndUserId(reminderId, userId);
    }

    @Transactional
    public void acknowledge(Long userId, Long reminderId) {
        Reminder reminder = getOwned(userId, reminderId);
        ReminderHistory history = ReminderHistory.builder()
                .reminderId(reminderId)
                .userId(userId)
                .triggeredAt(LocalDateTime.now())
                .acknowledged(true)
                .build();
        reminderHistoryRepository.save(history);
    }

    private Reminder getOwned(Long userId, Long id) {
        Reminder r = reminderRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder not found"));
        if (!r.getUserId().equals(userId)) throw new ForbiddenException("Access denied");
        return r;
    }

    public ReminderResponse toResponse(Reminder r) {
        return ReminderResponse.builder()
                .id(r.getId())
                .userId(r.getUserId())
                .taskId(r.getTaskId())
                .title(r.getTitle())
                .description(r.getDescription())
                .remindAt(r.getRemindAt())
                .repeatType(r.getRepeatType())
                .isActive(r.getIsActive())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
