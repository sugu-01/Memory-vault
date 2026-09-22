package com.memoryvault.repository;

import com.memoryvault.entity.Memory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemoryRepository extends JpaRepository<Memory, Long> {

    Page<Memory> findByUserIdAndDeletedFalse(Long userId, Pageable pageable);

    Page<Memory> findByUserIdAndIsImportantAndDeletedFalse(Long userId, Boolean isImportant, Pageable pageable);

    Optional<Memory> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);

    @Query("SELECT m FROM Memory m WHERE m.userId = :userId AND m.deleted = false AND " +
           "(LOWER(m.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.originalContent) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Memory> searchByUserIdAndQuery(@Param("userId") Long userId,
                                        @Param("query") String query,
                                        Pageable pageable);

    List<Memory> findByUserIdAndDeletedFalseOrderByMemoryDateDesc(Long userId);

    List<Memory> findByUserIdAndMemoryDateAndDeletedFalse(Long userId, java.time.LocalDate memoryDate);
}
