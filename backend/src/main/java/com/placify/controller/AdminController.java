package com.placify.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.placify.dto.admin.AdminStatsResponse;
import com.placify.dto.common.ApiResponse;
import com.placify.service.AdminStatsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminStatsService adminStatsService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {
        return ResponseEntity.ok(
                ApiResponse.<AdminStatsResponse>builder()
                        .success(true)
                        .message("Stats fetched successfully")
                        .data(adminStatsService.getStats())
                        .build()
        );
    }
}
