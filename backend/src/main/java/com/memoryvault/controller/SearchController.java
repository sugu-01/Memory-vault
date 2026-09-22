package com.memoryvault.controller;

import com.memoryvault.dto.response.ApiResponse;
import com.memoryvault.dto.response.GoalResponse;
import com.memoryvault.dto.response.MemoryResponse;
import com.memoryvault.dto.response.TaskResponse;
import com.memoryvault.entity.Goal;
import com.memoryvault.entity.Task;
import com.memoryvault.entity.User;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.GoalRepository;
import com.memoryvault.repository.TaskRepository;
import com.memoryvault.repository.UserRepository;
import com.memoryvault.service.GoalService;
import com.memoryvault.service.MemoryService;
import com.memoryvault.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final MemoryService memoryService;
    private final TaskRepository taskRepository;
    private final GoalRepository goalRepository;
    private final TaskService taskService;
    private final GoalService goalService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String q) {
        Long userId = getUserId(userDetails);

        List<MemoryResponse> memories = memoryService.search(userId, q, 0, 10).getContent();
        List<TaskResponse> tasks = taskRepository.searchByUserIdAndQuery(userId, q)
                .stream().limit(10).map(taskService::toResponse).collect(Collectors.toList());
        List<GoalResponse> goals = goalRepository.searchByUserIdAndQuery(userId, q)
                .stream().limit(10).map(goalService::toGoalResponse).collect(Collectors.toList());

        Map<String, Object> results = new HashMap<>();
        results.put("memories", memories);
        results.put("tasks", tasks);
        results.put("goals", goals);

        return ResponseEntity.ok(ApiResponse.success("Search results", results));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found")).getId();
    }
}
