package com.memoryvault.controller;

import com.memoryvault.dto.request.GoalRequest;
import com.memoryvault.dto.request.ProcessRequest;
import com.memoryvault.dto.response.ApiResponse;
import com.memoryvault.dto.response.GoalResponse;
import com.memoryvault.dto.response.ProcessResponse;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.UserRepository;
import com.memoryvault.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<GoalResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody GoalRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Goal created", goalService.createGoal(getUserId(userDetails), req)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GoalResponse>>> findAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("OK", goalService.findAllGoals(getUserId(userDetails))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GoalResponse>> findById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("OK", goalService.findGoalById(getUserId(userDetails), id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GoalResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody GoalRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Goal updated", goalService.updateGoal(getUserId(userDetails), id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        goalService.softDeleteGoal(getUserId(userDetails), id);
        return ResponseEntity.ok(ApiResponse.success("Goal deleted", null));
    }

    // --- Process sub-resources ---

    @PostMapping("/{goalId}/processes")
    public ResponseEntity<ApiResponse<ProcessResponse>> createProcess(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long goalId,
            @Valid @RequestBody ProcessRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Process created",
                goalService.createProcess(getUserId(userDetails), goalId, req)));
    }

    @GetMapping("/{goalId}/processes")
    public ResponseEntity<ApiResponse<List<ProcessResponse>>> getProcesses(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long goalId) {
        return ResponseEntity.ok(ApiResponse.success("OK",
                goalService.findProcessesByGoal(getUserId(userDetails), goalId)));
    }

    @PutMapping("/{goalId}/processes/{processId}")
    public ResponseEntity<ApiResponse<ProcessResponse>> updateProcess(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long goalId,
            @PathVariable Long processId,
            @Valid @RequestBody ProcessRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Process updated",
                goalService.updateProcess(getUserId(userDetails), goalId, processId, req)));
    }

    @DeleteMapping("/{goalId}/processes/{processId}")
    public ResponseEntity<ApiResponse<Void>> deleteProcess(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long goalId,
            @PathVariable Long processId) {
        goalService.softDeleteProcess(getUserId(userDetails), goalId, processId);
        return ResponseEntity.ok(ApiResponse.success("Process deleted", null));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found")).getId();
    }
}
