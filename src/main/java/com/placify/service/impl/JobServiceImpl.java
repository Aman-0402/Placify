package com.placify.service.impl;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.placify.dto.job.JobRequest;
import com.placify.dto.job.JobResponse;
import com.placify.entity.Company;
import com.placify.entity.Job;
import com.placify.entity.User;
import com.placify.exception.ResourceNotFoundException;
import com.placify.repository.CompanyRepository;
import com.placify.repository.JobRepository;
import com.placify.repository.UserRepository;
import com.placify.enums.NotificationType;
import com.placify.service.JobService;
import com.placify.service.NotificationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public JobResponse createJob(String email, JobRequest request) {
        Company company = getCompany(request.getCompanyId());
        User currentUser = getUserByEmail(email);

        Job job = new Job();
        applyJobValues(job, request, company, currentUser);
        JobResponse saved = mapJob(jobRepository.save(job));

        String message = "New job posted: " + saved.getTitle() + " at " + saved.getCompanyName()
                + ". Apply before " + saved.getApplicationDeadline() + ".";
        notificationService.notifyAllStudents(NotificationType.NEW_JOB, message, saved.getId());

        return saved;
    }

    @Override
    public List<JobResponse> getAllJobs() {
        return jobRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapJob)
                .toList();
    }

    @Override
    public List<JobResponse> getFilteredJobs(String title, Long companyId, String eligibility, Boolean active) {
        return jobRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(job -> title == null || title.isBlank()
                        || job.getTitle().toLowerCase().contains(title.trim().toLowerCase()))
                .filter(job -> companyId == null || job.getCompany().getId().equals(companyId))
                .filter(job -> eligibility == null || eligibility.isBlank()
                        || job.getEligibility().toLowerCase().contains(eligibility.trim().toLowerCase()))
                .filter(job -> active == null || job.isActive() == active)
                .map(this::mapJob)
                .toList();
    }

    @Override
    public JobResponse getJobById(Long jobId) {
        return mapJob(getJobEntity(jobId));
    }

    @Override
    public List<JobResponse> getJobsByCompany(Long companyId) {
        return jobRepository.findByCompanyIdOrderByCreatedAtDesc(companyId).stream()
                .map(this::mapJob)
                .toList();
    }

    @Override
    public List<JobResponse> getAvailableJobs(String title, Long companyId, String eligibility) {
        return getFilteredJobs(title, companyId, eligibility, true);
    }

    @Override
    @Transactional
    public JobResponse updateJob(Long jobId, String email, JobRequest request) {
        Job job = getJobEntity(jobId);
        Company company = getCompany(request.getCompanyId());
        User currentUser = getUserByEmail(email);

        applyJobValues(job, request, company, currentUser);
        return mapJob(jobRepository.save(job));
    }

    @Override
    @Transactional
    public void deleteJob(Long jobId, String email) {
        getUserByEmail(email);
        jobRepository.delete(getJobEntity(jobId));
    }

    @Override
    @Transactional
    public JobResponse toggleActive(Long jobId, String email) {
        getUserByEmail(email);
        Job job = getJobEntity(jobId);
        job.setActive(!job.isActive());
        return mapJob(jobRepository.save(job));
    }

    private void applyJobValues(Job job, JobRequest request, Company company, User currentUser) {
        job.setTitle(request.getTitle().trim());
        job.setDescription(request.getDescription().trim());
        job.setEligibility(request.getEligibility().trim());
        job.setEligibilityCriteria(request.getEligibility().trim());
        job.setLocation(request.getLocation() != null && !request.getLocation().isBlank()
                ? request.getLocation().trim()
                : (job.getLocation() != null ? job.getLocation() : "Remote"));
        job.setSalaryPackage(request.getSalaryPackage() != null && !request.getSalaryPackage().isBlank()
                ? request.getSalaryPackage().trim()
                : (job.getSalaryPackage() != null ? job.getSalaryPackage() : "Confidential"));
        job.setApplicationDeadline(request.getApplicationDeadline() != null
                ? request.getApplicationDeadline()
                : (job.getApplicationDeadline() != null ? job.getApplicationDeadline() : LocalDate.now().plusDays(30)));
        job.setActive(true);
        job.setCompany(company);
        job.setRecruiter(job.getRecruiter() != null ? job.getRecruiter() : currentUser);
    }

    private Company getCompany(Long companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private Job getJobEntity(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private JobResponse mapJob(Job job) {
        return JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .description(job.getDescription())
                .eligibility(job.getEligibility())
                .location(job.getLocation())
                .salaryPackage(job.getSalaryPackage())
                .applicationDeadline(job.getApplicationDeadline())
                .active(job.isActive())
                .companyId(job.getCompany().getId())
                .companyName(job.getCompany().getName())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
