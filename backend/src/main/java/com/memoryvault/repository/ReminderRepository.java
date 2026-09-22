package com.memoryvault.repository;

import com.memoryvault.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    List<Reminder> findByUserIdAndDeletedFalse(Long userId);
    Optional<Reminder> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);
    Optional<Reminder> findByIdAndDeletedFalse(Long id);
    List<Reminder> findByUserIdAndIsActiveAndDeletedFalse(Long userId, Boolean isActive);
}
