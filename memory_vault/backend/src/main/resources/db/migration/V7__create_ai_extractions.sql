CREATE TABLE IF NOT EXISTS ai_extractions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    memory_id BIGINT NOT NULL,
    important_points TEXT,
    extracted_tasks TEXT,
    extracted_reminders TEXT,
    extracted_goals TEXT,
    keywords TEXT,
    sentiment VARCHAR(20),
    processing_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ae_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_ae_memory FOREIGN KEY (memory_id) REFERENCES memories(id),
    INDEX idx_ae_memory_id (memory_id),
    INDEX idx_ae_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
