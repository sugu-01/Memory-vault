package com.memoryvault.controller;

import com.memoryvault.dto.request.MemoryRequest;
import com.memoryvault.dto.response.ApiResponse;
import com.memoryvault.dto.response.MemoryResponse;
import com.memoryvault.dto.response.PageResponse;
import com.memoryvault.entity.User;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.UserRepository;
import com.memoryvault.service.MemoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/memories")
@RequiredArgsConstructor
public class MemoryController {

    private final MemoryService memoryService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<MemoryResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody MemoryRequest req) {
        Long userId = getUserId(userDetails);
        MemoryResponse response = memoryService.create(userId, req);
        return ResponseEntity.ok(ApiResponse.success("Memory saved successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<MemoryResponse>>> findAll(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean isImportant) {
        Long userId = getUserId(userDetails);
        PageResponse<MemoryResponse> result = memoryService.findAll(userId, page, size, isImportant);
        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MemoryResponse>> findById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success("OK", memoryService.findById(userId, id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MemoryResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody MemoryRequest req) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success("Memory updated successfully", memoryService.update(userId, id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Long userId = getUserId(userDetails);
        memoryService.softDelete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Memory deleted", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<MemoryResponse>>> search(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success("OK", memoryService.search(userId, q, page, size)));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<MemoryResponse>>> recent(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "5") int limit) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success("OK", memoryService.findRecentForDashboard(userId, limit)));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found")).getId();
    }
}
