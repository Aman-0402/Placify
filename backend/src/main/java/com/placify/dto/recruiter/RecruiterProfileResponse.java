package com.placify.dto.recruiter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecruiterProfileResponse {

    private Long id;
    private String name;
    private String email;
    private String company;
    private String position;
    private Integer experienceYears;
    private String bio;
    private String linkedIn;
}
