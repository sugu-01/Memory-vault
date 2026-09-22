package com.memoryvault.controller;

import com.memoryvault.dto.request.TaskRequest;
import com.memoryvault.dto.response.ApiResponse;
import com.memoryvault.dto.response.TaskResponse;
import com.memoryvault.entity.User;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.UserRepository;
import com.memoryvault.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TaskRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Task created", taskService.create(getUserId(userDetails), req)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> findAll(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long memoryId) {
        return ResponseEntity.ok(ApiResponse.success("OK", taskService.findAll(getUserId(userDetails), status, memoryId)));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> upcoming(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.success("OK", taskService.findUpcoming(getUserId(userDetails), limit)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> findById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("OK", taskService.findById(getUserId(userDetails), id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody TaskRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Task updated", taskService.update(getUserId(userDetails), id, req)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(ApiResponse.success("Status updated", taskService.updateStatus(getUserId(userDetails), id, status)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        taskService.softDelete(getUserId(userDetails), id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted", null));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found")).getId();
    }
}
