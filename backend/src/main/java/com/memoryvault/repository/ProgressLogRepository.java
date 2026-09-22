package com.memoryvault.repository;

import com.memoryvault.entity.ProgressLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgressLogRepository extends JpaRepository<ProgressLog, Long> {
    List<ProgressLog> findByUserId(Long userId);
    List<ProgressLog> findByUserIdOrderByLogDateDesc(Long userId);
    List<ProgressLog> findByUserIdAndGoalId(Long userId, Long goalId);
    List<ProgressLog> findByUserIdAndGoalIdOrderByLogDateDesc(Long userId, Long goalId);
    List<ProgressLog> findByUserIdAndProcessId(Long userId, Long processId);
    List<ProgressLog> findByUserIdAndProcessIdOrderByLogDateDesc(Long userId, Long processId);
}
