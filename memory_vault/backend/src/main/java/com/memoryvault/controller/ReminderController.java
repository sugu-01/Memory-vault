package com.memoryvault.controller;

import com.memoryvault.dto.request.ReminderRequest;
import com.memoryvault.dto.response.ApiResponse;
import com.memoryvault.dto.response.ReminderResponse;
import com.memoryvault.entity.ReminderHistory;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.UserRepository;
import com.memoryvault.service.ReminderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<ReminderResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReminderRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Reminder created", reminderService.create(getUserId(userDetails), req)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReminderResponse>>> findAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("OK", reminderService.findAll(getUserId(userDetails))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReminderResponse>> findById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("OK", reminderService.findById(getUserId(userDetails), id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReminderResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody ReminderRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Reminder updated", reminderService.update(getUserId(userDetails), id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        reminderService.softDelete(getUserId(userDetails), id);
        return ResponseEntity.ok(ApiResponse.success("Reminder deleted", null));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<ReminderHistory>>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("OK", reminderService.getHistory(getUserId(userDetails), id)));
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<ApiResponse<Void>> acknowledge(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        reminderService.acknowledge(getUserId(userDetails), id);
        return ResponseEntity.ok(ApiResponse.success("Acknowledged", null));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found")).getId();
    }
}
