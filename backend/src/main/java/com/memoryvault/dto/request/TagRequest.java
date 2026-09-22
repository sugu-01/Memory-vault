package com.memoryvault.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TagRequest {
    @NotBlank(message = "Tag name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 7)
    private String color = "#6366f1";
}
