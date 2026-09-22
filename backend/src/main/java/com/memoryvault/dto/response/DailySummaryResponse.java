package com.memoryvault.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySummaryResponse {
    private LocalDate date;
    private int memoryCountToday;
    private List<MemoryResponse> memoriesToday;
    private List<TaskResponse> completedTasksToday;
    private List<TaskResponse> pendingTasks;
    private List<ReminderResponse> upcomingReminders;
    private int totalPendingTasks;
    private int totalCompletedTasks;
    private int activeGoalsCount;
    private String motivationText;
}
