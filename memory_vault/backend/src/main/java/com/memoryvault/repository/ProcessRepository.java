package com.memoryvault.repository;

import com.memoryvault.entity.Process;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcessRepository extends JpaRepository<Process, Long> {
    List<Process> findByUserIdAndDeletedFalse(Long userId);
    List<Process> findByUserIdAndGoalIdAndDeletedFalse(Long userId, Long goalId);
    Optional<Process> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);
    Optional<Process> findByIdAndDeletedFalse(Long id);
    List<Process> findByGoalIdAndDeletedFalseOrderByOrderIndexAsc(Long goalId);
}
