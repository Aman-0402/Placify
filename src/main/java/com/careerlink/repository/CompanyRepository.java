package com.careerlink.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.careerlink.entity.Company;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
