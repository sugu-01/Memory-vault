package com.memoryvault.repository;

import com.memoryvault.entity.ReminderHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReminderHistoryRepository extends JpaRepository<ReminderHistory, Long> {
    List<ReminderHistory> findByReminderIdAndUserId(Long reminderId, Long userId);
    List<ReminderHistory> findByUserIdOrderByTriggeredAtDesc(Long userId);
}
