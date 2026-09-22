package com.memoryvault.repository;

import com.memoryvault.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUserIdAndDeletedFalse(Long userId);
    Optional<Goal> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);
    Optional<Goal> findByIdAndDeletedFalse(Long id);
    List<Goal> findByUserIdAndStatusAndDeletedFalse(Long userId, String status);

    @org.springframework.data.jpa.repository.Query("SELECT g FROM Goal g WHERE g.userId = :userId AND g.deleted = false AND " +
           "(LOWER(g.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(g.description IS NOT NULL AND LOWER(g.description) LIKE LOWER(CONCAT('%', :query, '%'))))")
    List<Goal> searchByUserIdAndQuery(@org.springframework.data.repository.query.Param("userId") Long userId,
                                      @org.springframework.data.repository.query.Param("query") String query);
}
