package com.memoryvault.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "memory_tags")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(MemoryTag.MemoryTagId.class)
public class MemoryTag {

    @Id
    @Column(name = "memory_id")
    private Long memoryId;

    @Id
    @Column(name = "tag_id")
    private Long tagId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemoryTagId implements Serializable {
        private Long memoryId;
        private Long tagId;
    }
}
