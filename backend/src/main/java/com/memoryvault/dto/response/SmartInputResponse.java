package com.memoryvault.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartInputResponse {
    private MemoryResponse memory;
    private TaskResponse taskCreated;
    private TaskResponse taskCompleted;
    private ReminderResponse reminderCreated;
    private List<String> actionsPerformed;
    private String summaryMessage;
}
