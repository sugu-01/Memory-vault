package com.memoryvault.controller;

import com.memoryvault.dto.request.ProgressLogRequest;
import com.memoryvault.dto.response.ApiResponse;
import com.memoryvault.entity.ProgressLog;
import com.memoryvault.entity.User;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.UserRepository;
import com.memoryvault.service.ProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<ProgressLog>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProgressLogRequest req) {
        Long userId = getUserId(userDetails);
        ProgressLog log = progressService.create(userId, req);
        return ResponseEntity.ok(ApiResponse.success("Progress logged successfully", log));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProgressLog>>> findAll(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Long goalId,
            @RequestParam(required = false) Long processId) {
        Long userId = getUserId(userDetails);
        List<ProgressLog> logs = progressService.findAll(userId, goalId, processId);
        return ResponseEntity.ok(ApiResponse.success("OK", logs));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Long userId = getUserId(userDetails);
        progressService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Progress log deleted", null));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found")).getId();
    }
}
