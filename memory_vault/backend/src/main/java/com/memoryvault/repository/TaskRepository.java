package com.memoryvault.repository;

import com.memoryvault.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUserIdAndDeletedFalse(Long userId);

    List<Task> findByUserIdAndStatusAndDeletedFalse(Long userId, Task.TaskStatus status);

    List<Task> findByUserIdAndMemoryIdAndDeletedFalse(Long userId, Long memoryId);

    Optional<Task> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);

    Optional<Task> findByIdAndDeletedFalse(Long id);

    List<Task> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(Long userId);

    List<Task> findByUserIdAndDeletedFalseAndStatusNotOrderByDueDateAsc(Long userId, Task.TaskStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT t FROM Task t WHERE t.userId = :userId AND t.deleted = false AND " +
           "(LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(t.description IS NOT NULL AND LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%'))))")
    List<Task> searchByUserIdAndQuery(@org.springframework.data.repository.query.Param("userId") Long userId,
                                      @org.springframework.data.repository.query.Param("query") String query);
}
