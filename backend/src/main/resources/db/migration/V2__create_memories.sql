CREATE TABLE IF NOT EXISTS memories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255),
    original_content LONGTEXT NOT NULL,
    mood VARCHAR(50),
    is_important TINYINT(1) NOT NULL DEFAULT 0,
    memory_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_memories_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_memories_user_id (user_id),
    INDEX idx_memories_date (memory_date),
    INDEX idx_memories_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
