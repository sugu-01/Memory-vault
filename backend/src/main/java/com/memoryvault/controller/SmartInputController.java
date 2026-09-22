package com.memoryvault.controller;

import com.memoryvault.dto.request.SmartInputRequest;
import com.memoryvault.dto.request.TaskQuickActionRequest;
import com.memoryvault.dto.response.ApiResponse;
import com.memoryvault.dto.response.DailySummaryResponse;
import com.memoryvault.dto.response.SmartInputResponse;
import com.memoryvault.dto.response.TaskResponse;
import com.memoryvault.entity.User;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.UserRepository;
import com.memoryvault.service.SmartInputService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SmartInputController {

    private final SmartInputService smartInputService;
    private final UserRepository userRepository;

    @PostMapping("/smart-input")
    public ResponseEntity<ApiResponse<SmartInputResponse>> processInput(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SmartInputRequest req) {
        Long userId = getUserId(userDetails);
        SmartInputResponse resp = smartInputService.processSmartInput(userId, req);
        return ResponseEntity.ok(ApiResponse.success(resp.getSummaryMessage(), resp));
    }

    @GetMapping("/daily-summary")
    public ResponseEntity<ApiResponse<DailySummaryResponse>> getDailySummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Long userId = getUserId(userDetails);
        DailySummaryResponse summary = smartInputService.getDailySummary(userId, date);
        return ResponseEntity.ok(ApiResponse.success("Daily summary retrieved", summary));
    }

    @PostMapping("/tasks/{id}/quick-action")
    public ResponseEntity<ApiResponse<TaskResponse>> quickAction(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody TaskQuickActionRequest req) {
        Long userId = getUserId(userDetails);
        TaskResponse resp = smartInputService.quickActionTask(userId, id, req.getAction());
        return ResponseEntity.ok(ApiResponse.success("Task updated", resp));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found")).getId();
    }
}
