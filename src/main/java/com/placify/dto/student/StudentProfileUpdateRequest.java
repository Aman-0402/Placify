package com.placify.dto.student;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfileUpdateRequest {

    @NotBlank(message = "Skills are required")
    @Size(max = 1000, message = "Skills must not exceed 1000 characters")
    private String skills;

    @NotBlank(message = "Resume is required")
    @Size(max = 255, message = "Resume must not exceed 255 characters")
    private String resume;

    @NotBlank(message = "Branch is required")
    @Size(max = 100, message = "Branch must not exceed 100 characters")
    private String branch;
}
