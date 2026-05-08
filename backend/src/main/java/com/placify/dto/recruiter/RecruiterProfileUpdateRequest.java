package com.placify.dto.recruiter;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecruiterProfileUpdateRequest {

    @Size(max = 150, message = "Company name must not exceed 150 characters")
    private String company;

    @Size(max = 100, message = "Position must not exceed 100 characters")
    private String position;

    @Min(value = 0, message = "Experience years cannot be negative")
    @Max(value = 60, message = "Experience years must not exceed 60")
    private Integer experienceYears;

    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;

    @Size(max = 200, message = "LinkedIn URL must not exceed 200 characters")
    private String linkedIn;
}
