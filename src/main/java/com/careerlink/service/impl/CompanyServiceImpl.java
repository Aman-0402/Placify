package com.careerlink.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careerlink.dto.company.CompanyRequest;
import com.careerlink.dto.company.CompanyResponse;
import com.careerlink.entity.Company;
import com.careerlink.entity.User;
import com.careerlink.exception.BadRequestException;
import com.careerlink.exception.ResourceNotFoundException;
import com.careerlink.repository.CompanyRepository;
import com.careerlink.repository.UserRepository;
import com.careerlink.service.CompanyService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CompanyResponse createCompany(String email, CompanyRequest request) {
        String name = request.getName().trim();
        if (companyRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Company name already exists");
        }

        User currentUser = getUserByEmail(email);
        Company company = new Company();
        company.setName(name);
        company.setIndustry("General");
        company.setWebsite("https://example.com");
        company.setLocation("Not Specified");
        company.setDescription(request.getDescription().trim());
        company.setCreatedBy(currentUser);

        return mapCompany(companyRepository.save(company));
    }

    @Override
    public List<CompanyResponse> getAllCompanies() {
        return companyRepository.findAll().stream()
                .map(this::mapCompany)
                .toList();
    }

    @Override
    public CompanyResponse getCompanyById(Long companyId) {
        return mapCompany(getCompanyEntity(companyId));
    }

    @Override
    @Transactional
    public CompanyResponse updateCompany(Long companyId, String email, CompanyRequest request) {
        Company company = getCompanyEntity(companyId);
        getUserByEmail(email);
        String name = request.getName().trim();

        if (companyRepository.existsByNameIgnoreCaseAndIdNot(name, companyId)) {
            throw new BadRequestException("Company name already exists");
        }

        company.setName(name);
        company.setDescription(request.getDescription().trim());
        return mapCompany(companyRepository.save(company));
    }

    @Override
    @Transactional
    public void deleteCompany(Long companyId, String email) {
        getUserByEmail(email);
        companyRepository.delete(getCompanyEntity(companyId));
    }

    private Company getCompanyEntity(Long companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private CompanyResponse mapCompany(Company company) {
        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .description(company.getDescription())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .build();
    }
}
