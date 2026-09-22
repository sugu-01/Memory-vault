# 🧠 Memory Vault — Personal Life Management & Data Vault

A personal life-management web application designed with a **Database-First Architecture** where **data persistence and data safety are prioritized above all else**.

---

## 🔒 Critical Data Safety Safeguards Implemented

1. **Database as Single Source of Truth**:
   - Frontend state is never treated as permanent storage.
   - Saves are confirmed only after the MySQL database transaction commits.
2. **Original Diary Preservation**:
   - `original_content` is stored independently. AI analysis or suggestions never alter or overwrite the user's authentic writing.
3. **AI Failure Isolation**:
   - Diary entries are committed to the database **first**. AI extraction runs asynchronously. If AI fails or is unconfigured, the diary entry is 100% safely persisted.
4. **Soft-Delete Architecture**:
   - Critical user entities (`memories`, `tasks`, `goals`, `reminders`, `evaluations`) use `deleted = true` flags rather than destructive physical deletion.
5. **No Accidental Loss**:
   - Delete operations prompt explicit confirmation modals.
   - Network or validation failures preserve typed input inside forms so writing is never lost.
6. **Strict Ownership & Isolation**:
   - Every database record is bound to the authenticated `user_id` extracted securely from JWT tokens. Cross-user access is impossible.
7. **Portable Data Export**:
   - Full personal data backup available via authenticated JSON export and CSV downloads.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: HTML5, CSS3 (Modern Dark Theme), Vanilla JS Modules (SPA-like experience, zero npm dependencies required). Served directly by Spring Boot static handler.
- **Backend**: Java 17, Spring Boot 3.2, Spring Security (Stateless JWT + Refresh Token), Spring Data JPA.
- **Database**: MySQL 8.0 with Flyway additive versioned migrations (`V1` to `V8`).
- **AI**: Google Gemini API integration (asynchronous extraction and real-time life-management assistant).

---

## 🚀 Quick Start Guide

### 1. Start MySQL Database

You can run MySQL using Docker Compose:
```bash
docker-compose up -d
```
Or use a local MySQL instance with credentials:
- **Host**: `localhost:3306`
- **Database**: `memory_vault`
- **Username**: `root`
- **Password**: `root`

*(Database parameters can be modified in `backend/src/main/resources/application.yml` or via environment variables).*

### 2. Configure Gemini API (Optional)

In `backend/src/main/resources/application.yml` or set environment variable:
```bash
set GEMINI_API_KEY=your_gemini_api_key
```
*(The application functions completely without an API key; AI features will gracefully indicate they are unconfigured).*

### 3. Build and Run the Backend

Using Maven:
```bash
cd backend
mvn spring-boot:run
```

Once started, open your browser at:
👉 **[http://localhost:8080](http://localhost:8080)**

---

## 📱 Navigation & Features

| Section | Description |
|---|---|
| 🏠 **Dashboard** | Overview of recent entries, upcoming reminders, pending tasks, and goal metrics |
| 📖 **Diary** | Rich reflection editor, mood picker, tagging, important markers, and AI analysis insights |
| ✅ **Tasks** | Kanban board (Pending, In Progress, Completed) and list view with priority filters |
| 🔔 **Reminders** | Time-based reminders, recurrence settings, history logs, and acknowledgement triggers |
| 🎯 **Goals** | Life goals breakdown with nested milestone processes and daily progress logging |
| 📊 **Evaluate** | Daily, weekly, and monthly self-evaluation reviews with 1-10 scoring |
| 🤖 **AI Assistant** | Conversational assistant with context from your personal reflections |
| 🔍 **Search** | Universal search across memories, tasks, and goals simultaneously |
| ⚙️ **Settings** | User profile, password security, and **Data Export (JSON & CSV)** |
