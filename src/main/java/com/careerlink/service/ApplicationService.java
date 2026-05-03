package com.careerlink.service;

import java.util.List;

import com.careerlink.dto.application.ApplicationRequest;
import com.careerlink.dto.application.ApplicationResponse;
import com.careerlink.dto.application.ApplicationStatusUpdateRequest;

public interface ApplicationService {

    ApplicationResponse createApplication(String email, ApplicationRequest request);

    List<ApplicationResponse> getAllApplications();

    ApplicationResponse getApplicationById(Long applicationId);

    List<ApplicationResponse> getMyApplications(String email);

    List<ApplicationResponse> getApplicationsByStudent(Long studentId);

    List<ApplicationResponse> getApplicationsByJob(Long jobId);

    ApplicationResponse updateApplicationStatus(Long applicationId, ApplicationStatusUpdateRequest request);

    void deleteApplication(Long applicationId);
}
