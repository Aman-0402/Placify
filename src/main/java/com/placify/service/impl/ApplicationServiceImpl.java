package com.placify.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.placify.dto.application.ApplicationRequest;
import com.placify.dto.application.ApplicationResponse;
import com.placify.dto.application.ApplicationStatusUpdateRequest;
import com.placify.entity.Application;
import com.placify.entity.Job;
import com.placify.entity.Student;
import com.placify.enums.ApplicationStatus;
import com.placify.enums.NotificationType;
import com.placify.exception.BadRequestException;
import com.placify.exception.ResourceNotFoundException;
import com.placify.repository.ApplicationRepository;
import com.placify.repository.JobRepository;
import com.placify.repository.StudentRepository;
import com.placify.service.ApplicationService;
import com.placify.service.NotificationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final StudentRepository studentRepository;
    private final JobRepository jobRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ApplicationResponse createApplication(String email, ApplicationRequest request) {
        Student student = studentRepository.findByUserEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for authenticated user"));
        Job job = getJob(request.getJobId());

        if (applicationRepository.existsByStudentIdAndJobId(student.getId(), job.getId())) {
            throw new BadRequestException("Student has already applied for this job");
        }

        Application application = new Application();
        application.setStudent(student);
        application.setJob(job);
        application.setStatus(ApplicationStatus.APPLIED);

        return mapApplication(applicationRepository.save(application));
    }

    @Override
    public List<ApplicationResponse> getAllApplications() {
        return applicationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapApplication)
                .toList();
    }

    @Override
    public ApplicationResponse getApplicationById(Long applicationId) {
        return mapApplication(getApplicationEntity(applicationId));
    }

    @Override
    public List<ApplicationResponse> getMyApplications(String email) {
        Student student = studentRepository.findByUserEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for authenticated user"));
        return applicationRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .map(this::mapApplication)
                .toList();
    }

    @Override
    public List<ApplicationResponse> getApplicationsByStudent(Long studentId) {
        return applicationRepository.findByStudentIdOrderByCreatedAtDesc(studentId).stream()
                .map(this::mapApplication)
                .toList();
    }

    @Override
    public List<ApplicationResponse> getApplicationsByJob(Long jobId) {
        return applicationRepository.findByJobIdOrderByCreatedAtDesc(jobId).stream()
                .map(this::mapApplication)
                .toList();
    }

    @Override
    @Transactional
    public ApplicationResponse updateApplicationStatus(Long applicationId, ApplicationStatusUpdateRequest request) {
        Application application = getApplicationEntity(applicationId);
        application.setStatus(request.getStatus());
        ApplicationResponse saved = mapApplication(applicationRepository.save(application));

        String statusLabel = formatStatus(request.getStatus());
        String message = "Your application for " + application.getJob().getTitle()
                + " at " + application.getJob().getCompany().getName()
                + " has been updated to: " + statusLabel + ".";
        notificationService.notifyUser(application.getStudent().getUser().getId(),
                NotificationType.STATUS_CHANGED, message, applicationId);

        return saved;
    }

    private String formatStatus(ApplicationStatus status) {
        return switch (status) {
            case APPLIED -> "Applied";
            case IN_REVIEW -> "Under Review";
            case SHORTLISTED -> "Shortlisted";
            case INTERVIEW -> "Interview";
            case SELECTED -> "Selected — Congratulations!";
            case REJECTED -> "Rejected";
        };
    }

    @Override
    @Transactional
    public void deleteApplication(Long applicationId) {
        applicationRepository.delete(getApplicationEntity(applicationId));
    }

    private Application getApplicationEntity(Long applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
    }

    private Job getJob(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
    }

    private ApplicationResponse mapApplication(Application application) {
        return ApplicationResponse.builder()
                .id(application.getId())
                .studentId(application.getStudent().getId())
                .studentName(application.getStudent().getUser().getName())
                .jobId(application.getJob().getId())
                .jobTitle(application.getJob().getTitle())
                .companyName(application.getJob().getCompany().getName())
                .status(application.getStatus())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }
}
