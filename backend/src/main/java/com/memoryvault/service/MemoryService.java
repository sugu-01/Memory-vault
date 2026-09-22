package com.memoryvault.service;

import com.memoryvault.dto.request.MemoryRequest;
import com.memoryvault.dto.response.MemoryResponse;
import com.memoryvault.dto.response.PageResponse;
import com.memoryvault.dto.response.TagResponse;
import com.memoryvault.entity.Memory;
import com.memoryvault.entity.Tag;
import com.memoryvault.exception.ForbiddenException;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.MemoryRepository;
import com.memoryvault.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MemoryService {

    private final MemoryRepository memoryRepository;
    private final TagRepository tagRepository;
    private final ApplicationContext applicationContext;

    @Transactional
    public MemoryResponse create(Long userId, MemoryRequest req) {
        Set<Tag> tags = resolveTagIds(userId, req.getTagIds());

        Memory memory = Memory.builder()
                .userId(userId)
                .title(req.getTitle())
                .originalContent(req.getOriginalContent())
                .mood(req.getMood())
                .isImportant(req.getIsImportant() != null ? req.getIsImportant() : false)
                .memoryDate(req.getMemoryDate())
                .tags(tags)
                .build();

        memory = memoryRepository.save(memory);
        log.info("Memory {} saved for user {}", memory.getId(), userId);

        // Trigger AI analysis asynchronously - NEVER blocks diary save
        final Long memoryId = memory.getId();
        try {
            AiService aiService = applicationContext.getBean(AiService.class);
            aiService.analyzeMemoryAsync(memoryId, userId);
        } catch (Exception e) {
            log.warn("Failed to trigger AI analysis for memory {}, but diary entry is saved safely: {}", memoryId, e.getMessage());
        }

        return toResponse(memory);
    }

    @Transactional(readOnly = true)
    public PageResponse<MemoryResponse> findAll(Long userId, int page, int size, Boolean isImportant) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "memoryDate", "createdAt"));
        Page<Memory> result;
        if (isImportant != null) {
            result = memoryRepository.findByUserIdAndIsImportantAndDeletedFalse(userId, isImportant, pageable);
        } else {
            result = memoryRepository.findByUserIdAndDeletedFalse(userId, pageable);
        }
        return PageResponse.<MemoryResponse>builder()
                .content(result.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public MemoryResponse findById(Long userId, Long id) {
        Memory memory = memoryRepository.findByIdAndUserIdAndDeletedFalse(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Memory not found"));
        return toResponse(memory);
    }

    @Transactional
    public MemoryResponse update(Long userId, Long id, MemoryRequest req) {
        Memory memory = memoryRepository.findByIdAndUserIdAndDeletedFalse(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Memory not found"));

        // Validate ownership explicitly
        if (!memory.getUserId().equals(userId)) {
            throw new ForbiddenException("Access denied");
        }

        Set<Tag> tags = resolveTagIds(userId, req.getTagIds());

        memory.setTitle(req.getTitle());
        memory.setOriginalContent(req.getOriginalContent());
        memory.setMood(req.getMood());
        memory.setIsImportant(req.getIsImportant() != null ? req.getIsImportant() : memory.getIsImportant());
        memory.setMemoryDate(req.getMemoryDate());
        memory.setTags(tags);

        memory = memoryRepository.save(memory);
        log.info("Memory {} updated for user {}", memory.getId(), userId);
        return toResponse(memory);
    }

    @Transactional
    public void softDelete(Long userId, Long id) {
        Memory memory = memoryRepository.findByIdAndUserIdAndDeletedFalse(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Memory not found"));
        if (!memory.getUserId().equals(userId)) {
            throw new ForbiddenException("Access denied");
        }
        memory.setDeleted(true);
        memoryRepository.save(memory);
        log.info("Memory {} soft-deleted for user {}", id, userId);
    }

    @Transactional(readOnly = true)
    public PageResponse<MemoryResponse> search(Long userId, String query, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "memoryDate"));
        Page<Memory> result = memoryRepository.searchByUserIdAndQuery(userId, query, pageable);
        return PageResponse.<MemoryResponse>builder()
                .content(result.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public List<MemoryResponse> findRecentForDashboard(Long userId, int limit) {
        return memoryRepository.findByUserIdAndDeletedFalseOrderByMemoryDateDesc(userId)
                .stream().limit(limit).map(this::toResponse).collect(Collectors.toList());
    }

    private Set<Tag> resolveTagIds(Long userId, Set<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) return new HashSet<>();
        return tagIds.stream()
                .map(tagId -> tagRepository.findByIdAndUserId(tagId, userId)
                        .orElse(null))
                .filter(t -> t != null)
                .collect(Collectors.toSet());
    }

    public MemoryResponse toResponse(Memory m) {
        return MemoryResponse.builder()
                .id(m.getId())
                .userId(m.getUserId())
                .title(m.getTitle())
                .originalContent(m.getOriginalContent())
                .mood(m.getMood())
                .isImportant(m.getIsImportant())
                .memoryDate(m.getMemoryDate())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .tags(m.getTags() != null ? m.getTags().stream()
                        .map(t -> TagResponse.builder()
                                .id(t.getId())
                                .name(t.getName())
                                .color(t.getColor())
                                .createdAt(t.getCreatedAt())
                                .build())
                        .collect(Collectors.toSet()) : new HashSet<>())
                .build();
    }
}
