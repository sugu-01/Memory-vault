package com.memoryvault.controller;

import com.memoryvault.dto.request.EvaluationRequest;
import com.memoryvault.dto.response.ApiResponse;
import com.memoryvault.entity.Evaluation;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.UserRepository;
import com.memoryvault.service.EvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<Evaluation>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EvaluationRequest req) {
        Long userId = getUserId(userDetails);
        Evaluation evaluation = evaluationService.create(userId, req);
        return ResponseEntity.ok(ApiResponse.success("Evaluation saved successfully", evaluation));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Evaluation>>> findAll(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String periodType) {
        Long userId = getUserId(userDetails);
        List<Evaluation> list = evaluationService.findAll(userId, periodType);
        return ResponseEntity.ok(ApiResponse.success("OK", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Evaluation>> findById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success("OK", evaluationService.findById(userId, id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Evaluation>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody EvaluationRequest req) {
        Long userId = getUserId(userDetails);
        Evaluation updated = evaluationService.update(userId, id, req);
        return ResponseEntity.ok(ApiResponse.success("Evaluation updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Long userId = getUserId(userDetails);
        evaluationService.softDelete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Evaluation deleted", null));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found")).getId();
    }
}
