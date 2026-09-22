package com.memoryvault.controller;

import com.memoryvault.dto.request.TagRequest;
import com.memoryvault.dto.response.ApiResponse;
import com.memoryvault.dto.response.TagResponse;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.UserRepository;
import com.memoryvault.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<TagResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TagRequest req) {
        Long userId = getUserId(userDetails);
        TagResponse tag = tagService.create(userId, req);
        return ResponseEntity.ok(ApiResponse.success("Tag created", tag));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TagResponse>>> findAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success("OK", tagService.findAll(userId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody TagRequest req) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success("Tag updated", tagService.update(userId, id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Long userId = getUserId(userDetails);
        tagService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Tag deleted", null));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found")).getId();
    }
}
