package com.memoryvault.service;

import com.memoryvault.dto.request.TagRequest;
import com.memoryvault.dto.response.TagResponse;
import com.memoryvault.entity.Tag;
import com.memoryvault.exception.BadRequestException;
import com.memoryvault.exception.ForbiddenException;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;

    @Transactional
    public TagResponse create(Long userId, TagRequest req) {
        if (tagRepository.existsByUserIdAndName(userId, req.getName())) {
            throw new BadRequestException("Tag with this name already exists");
        }
        Tag tag = Tag.builder()
                .userId(userId)
                .name(req.getName())
                .color(req.getColor() != null ? req.getColor() : "#6366f1")
                .build();
        return toResponse(tagRepository.save(tag));
    }

    @Transactional(readOnly = true)
    public List<TagResponse> findAll(Long userId) {
        return tagRepository.findByUserId(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public TagResponse update(Long userId, Long id, TagRequest req) {
        Tag tag = tagRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found"));
        tag.setName(req.getName());
        if (req.getColor() != null) tag.setColor(req.getColor());
        return toResponse(tagRepository.save(tag));
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found"));
        if (!tag.getUserId().equals(userId)) throw new ForbiddenException("Access denied");
        tagRepository.delete(tag);
    }

    public TagResponse toResponse(Tag t) {
        return TagResponse.builder()
                .id(t.getId())
                .name(t.getName())
                .color(t.getColor())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
