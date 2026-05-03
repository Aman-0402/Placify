package com.careerlink.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careerlink.dto.application.ApplicationRequest;
import com.careerlink.dto.application.ApplicationResponse;
import com.careerlink.dto.application.ApplicationStatusUpdateRequest;
import com.careerlink.entity.Application;
import com.careerlink.entity.Job;
import com.careerlink.entity.Student;
import com.careerlink.enums.ApplicationStatus;
import com.careerlink.exception.BadRequestException;
import com.careerlink.exception.ResourceNotFoundException;
import com.careerlink.repository.ApplicationRepository;
import com.careerlink.repository.JobRepository;
import com.careerlink.repository.StudentRepository;
import com.careerlink.service.ApplicationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final StudentRepository studentRepository;
    private final JobRepository jobRepository;

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
        return mapApplication(applicationRepository.save(application));
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
