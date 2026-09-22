CREATE TABLE IF NOT EXISTS progress_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    goal_id BIGINT,
    process_id BIGINT,
    note TEXT,
    progress_value INT,
    log_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pl_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_pl_goal FOREIGN KEY (goal_id) REFERENCES goals(id),
    CONSTRAINT fk_pl_process FOREIGN KEY (process_id) REFERENCES processes(id),
    INDEX idx_pl_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tags_user FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_user_tag (user_id, name),
    INDEX idx_tags_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS memory_tags (
    memory_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (memory_id, tag_id),
    CONSTRAINT fk_mt_memory FOREIGN KEY (memory_id) REFERENCES memories(id),
    CONSTRAINT fk_mt_tag FOREIGN KEY (tag_id) REFERENCES tags(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
