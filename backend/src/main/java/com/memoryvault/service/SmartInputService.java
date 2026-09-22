package com.memoryvault.service;

import com.memoryvault.dto.request.MemoryRequest;
import com.memoryvault.dto.request.ReminderRequest;
import com.memoryvault.dto.request.SmartInputRequest;
import com.memoryvault.dto.request.TaskRequest;
import com.memoryvault.dto.response.DailySummaryResponse;
import com.memoryvault.dto.response.MemoryResponse;
import com.memoryvault.dto.response.ReminderResponse;
import com.memoryvault.dto.response.SmartInputResponse;
import com.memoryvault.dto.response.TaskResponse;
import com.memoryvault.entity.Goal;
import com.memoryvault.entity.Memory;
import com.memoryvault.entity.Reminder;
import com.memoryvault.entity.Task;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.GoalRepository;
import com.memoryvault.repository.MemoryRepository;
import com.memoryvault.repository.ReminderRepository;
import com.memoryvault.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmartInputService {

    private final MemoryService memoryService;
    private final TaskService taskService;
    private final ReminderService reminderService;
    private final MemoryRepository memoryRepository;
    private final TaskRepository taskRepository;
    private final ReminderRepository reminderRepository;
    private final GoalRepository goalRepository;

    @Transactional
    public SmartInputResponse processSmartInput(Long userId, SmartInputRequest req) {
        String rawText = req.getText().trim();
        LocalDate targetDate = req.getDate() != null ? req.getDate() : LocalDate.now();
        List<String> actions = new ArrayList<>();

        // 1. Determine mood and importance
        String lower = rawText.toLowerCase(Locale.ROOT);
        boolean isImportant = lower.contains("important") || lower.contains("remember") ||
                              lower.contains("urgent") || lower.contains("sir said") ||
                              lower.contains("deadline") || lower.contains("review next") ||
                              lower.contains("exam") || lower.contains("critical");

        String mood = "NEUTRAL";
        if (lower.contains("finished") || lower.contains("completed") || lower.contains("great") ||
            lower.contains("learned") || lower.contains("happy") || lower.contains("proud") || lower.contains("yay")) {
            mood = "HAPPY";
        } else if (lower.contains("stressed") || lower.contains("tired") || lower.contains("exhausted")) {
            mood = "TIRED";
        } else if (lower.contains("sad") || lower.contains("failed") || lower.contains("bad")) {
            mood = "SAD";
        }

        // Generate title snippet
        String title = generateTitleSnippet(rawText);

        // 2. Always safely save the authentic Memory entry FIRST
        MemoryRequest memoryReq = new MemoryRequest();
        memoryReq.setTitle(title);
        memoryReq.setOriginalContent(rawText);
        memoryReq.setMood(mood);
        memoryReq.setIsImportant(isImportant);
        memoryReq.setMemoryDate(targetDate);

        MemoryResponse savedMemory = memoryService.create(userId, memoryReq);
        actions.add("Recorded in My Memory");

        TaskResponse taskCompleted = null;
        TaskResponse taskCreated = null;
        ReminderResponse reminderCreated = null;

        // 3. Automated check: Was an existing task completed?
        boolean mentionsCompletion = lower.startsWith("finished") || lower.startsWith("completed") ||
                                     lower.startsWith("done with") || lower.contains("finished my") ||
                                     lower.contains("completed my") || lower.contains("solved");

        if (mentionsCompletion) {
            List<Task> pendingTasks = taskRepository.findByUserIdAndStatusAndDeletedFalse(userId, Task.TaskStatus.PENDING);
            Task matchedTask = findMatchingTask(pendingTasks, lower);
            if (matchedTask != null) {
                taskCompleted = taskService.updateStatus(userId, matchedTask.getId(), "COMPLETED");
                actions.add("Completed task: \"" + matchedTask.getTitle() + "\"");
            }
        }

        // 4. Automated check: Is there an upcoming commitment or task to be created?
        boolean mentionsFuture = lower.contains("tomorrow") || lower.contains("next week") ||
                                 lower.contains("next friday") || lower.contains("next monday") ||
                                 lower.contains("need to") || lower.contains("have to") ||
                                 lower.contains("must ") || lower.contains("due on") ||
                                 lower.contains("remind me");

        if (mentionsFuture) {
            LocalDate taskDueDate = targetDate;
            if (lower.contains("tomorrow")) {
                taskDueDate = targetDate.plusDays(1);
            } else if (lower.contains("next week")) {
                taskDueDate = targetDate.plusWeeks(1);
            } else if (lower.contains("next friday")) {
                taskDueDate = targetDate.plusDays((5 - targetDate.getDayOfWeek().getValue() + 7) % 7);
                if (taskDueDate.equals(targetDate)) taskDueDate = taskDueDate.plusWeeks(1);
            } else if (lower.contains("next monday")) {
                taskDueDate = targetDate.plusDays((1 - targetDate.getDayOfWeek().getValue() + 7) % 7);
                if (taskDueDate.equals(targetDate)) taskDueDate = taskDueDate.plusWeeks(1);
            }

            String taskTitle = extractTaskTitle(rawText);

            // Check if duplicate task already exists
            List<Task> existingPending = taskRepository.findByUserIdAndStatusAndDeletedFalse(userId, Task.TaskStatus.PENDING);
            boolean isDuplicate = existingPending.stream()
                    .anyMatch(t -> t.getTitle().equalsIgnoreCase(taskTitle) ||
                                   (taskTitle.length() > 6 && t.getTitle().toLowerCase().contains(taskTitle.toLowerCase())));

            if (!isDuplicate && !taskTitle.isBlank()) {
                TaskRequest tr = new TaskRequest();
                tr.setTitle(taskTitle);
                tr.setDescription("Auto-extracted from memory: " + (rawText.length() > 100 ? rawText.substring(0, 100) + "..." : rawText));
                tr.setDueDate(taskDueDate);
                tr.setPriority(isImportant ? "HIGH" : "MEDIUM");
                tr.setStatus("PENDING");
                tr.setMemoryId(savedMemory.getId());

                taskCreated = taskService.create(userId, tr);
                actions.add("Created task: \"" + taskTitle + "\" (Due " + taskDueDate + ")");

                // Also automatically schedule an active Reminder for this deadline at 9:00 AM
                ReminderRequest rr = new ReminderRequest();
                rr.setTitle(taskTitle);
                rr.setDescription("Reminder for: " + taskTitle);
                rr.setRemindAt(taskDueDate.atTime(9, 0));
                rr.setRepeatType("NONE");
                rr.setTaskId(taskCreated.getId());

                reminderCreated = reminderService.create(userId, rr);
                actions.add("Scheduled reminder for " + taskDueDate);
            }
        }

        String summary = String.join(" • ", actions);

        return SmartInputResponse.builder()
                .memory(savedMemory)
                .taskCreated(taskCreated)
                .taskCompleted(taskCompleted)
                .reminderCreated(reminderCreated)
                .actionsPerformed(actions)
                .summaryMessage(summary)
                .build();
    }

    @Transactional(readOnly = true)
    public DailySummaryResponse getDailySummary(Long userId, LocalDate date) {
        LocalDate queryDate = date != null ? date : LocalDate.now();

        // 1. Memories today
        List<MemoryResponse> memoriesToday = memoryRepository
                .findByUserIdAndMemoryDateAndDeletedFalse(userId, queryDate)
                .stream()
                .map(memoryService::toResponse)
                .collect(Collectors.toList());

        // 2. Completed tasks today
        List<TaskResponse> allTasks = taskRepository.findByUserIdAndDeletedFalse(userId)
                .stream()
                .map(taskService::toResponse)
                .collect(Collectors.toList());

        List<TaskResponse> completedToday = allTasks.stream()
                .filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus()))
                .filter(t -> t.getCompletedAt() != null && t.getCompletedAt().toLocalDate().equals(queryDate))
                .collect(Collectors.toList());

        List<TaskResponse> pendingTasks = allTasks.stream()
                .filter(t -> !"COMPLETED".equalsIgnoreCase(t.getStatus()))
                .collect(Collectors.toList());

        int totalCompleted = (int) allTasks.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).count();

        // 3. Upcoming reminders
        LocalDateTime startOfToday = queryDate.atStartOfDay();
        LocalDateTime endOfTomorrow = queryDate.plusDays(1).atTime(23, 59, 59);

        List<ReminderResponse> upcomingReminders = reminderRepository.findByUserIdAndDeletedFalse(userId)
                .stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsActive()))
                .filter(r -> r.getRemindAt() != null && !r.getRemindAt().isBefore(startOfToday) && !r.getRemindAt().isAfter(endOfTomorrow))
                .map(reminderService::toResponse)
                .collect(Collectors.toList());

        // 4. Goals count
        List<Goal> activeGoals = goalRepository.findByUserIdAndStatusAndDeletedFalse(userId, "ACTIVE");

        String motivation = "Keep moving forward at your own gentle pace.";
        if (completedToday.size() >= 3) {
            motivation = "Great progress today! Remember to rest well.";
        } else if (memoriesToday.size() >= 2) {
            motivation = "Wonderful reflections recorded today.";
        }

        return DailySummaryResponse.builder()
                .date(queryDate)
                .memoryCountToday(memoriesToday.size())
                .memoriesToday(memoriesToday)
                .completedTasksToday(completedToday)
                .pendingTasks(pendingTasks)
                .upcomingReminders(upcomingReminders)
                .totalPendingTasks(pendingTasks.size())
                .totalCompletedTasks(totalCompleted)
                .activeGoalsCount(activeGoals.size())
                .motivationText(motivation)
                .build();
    }

    @Transactional
    public TaskResponse quickActionTask(Long userId, Long taskId, String action) {
        Task task = taskRepository.findByIdAndUserIdAndDeletedFalse(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        String act = action != null ? action.toUpperCase(Locale.ROOT) : "";
        if ("DONE".equals(act) || "COMPLETE".equals(act)) {
            task.setStatus(Task.TaskStatus.COMPLETED);
            task.setCompletedAt(LocalDateTime.now());
        } else if ("TOMORROW".equals(act)) {
            task.setDueDate(LocalDate.now().plusDays(1));
            task.setStatus(Task.TaskStatus.PENDING);
            task.setCompletedAt(null);
        } else if ("SKIP".equals(act)) {
            task.setStatus(Task.TaskStatus.CANCELLED);
        }

        task = taskRepository.save(task);
        return taskService.toResponse(task);
    }

    private String generateTitleSnippet(String text) {
        if (text.length() <= 40) return text;
        int firstPeriod = text.indexOf('.');
        if (firstPeriod > 0 && firstPeriod <= 50) {
            return text.substring(0, firstPeriod).trim();
        }
        return text.substring(0, 37).trim() + "...";
    }

    private Task findMatchingTask(List<Task> tasks, String lowerText) {
        for (Task t : tasks) {
            String title = t.getTitle().toLowerCase(Locale.ROOT);
            // Direct substring
            if (lowerText.contains(title)) return t;
            // Keywords match
            String[] words = title.split("\\s+");
            int matches = 0;
            for (String w : words) {
                if (w.length() > 3 && lowerText.contains(w)) matches++;
            }
            if (matches >= 2 || (words.length == 1 && matches == 1)) return t;
        }
        return null;
    }

    private String extractTaskTitle(String rawText) {
        String clean = rawText.trim();
        // Remove trailing punctuation
        clean = clean.replaceAll("[.!?]+$", "");

        // Regex patterns for task phrases
        Pattern[] patterns = new Pattern[] {
            Pattern.compile("(?i)(?:tomorrow\\s+(?:i\\s+)?(?:need\\s+to|have\\s+to|must)\\s+)(.+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i)(?:(?:i\\s+)?need\\s+to|have\\s+to|must)\\s+(.+?)(?:\\s+tomorrow|\\s+next\\s+\\w+|$)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i)tomorrow\\s+(.+)", Pattern.CASE_INSENSITIVE)
        };

        for (Pattern p : patterns) {
            Matcher m = p.matcher(clean);
            if (m.find()) {
                String extracted = m.group(1).trim();
                // capitalize first letter
                if (!extracted.isEmpty()) {
                    return Character.toUpperCase(extracted.charAt(0)) + extracted.substring(1);
                }
            }
        }

        return clean.length() > 60 ? clean.substring(0, 57) + "..." : clean;
    }
}
