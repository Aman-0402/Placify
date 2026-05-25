package com.placify.service;

import com.placify.enums.ApplicationStatus;

public interface EmailService {

    void sendApplicationConfirmation(String toEmail, String studentName,
                                     String jobTitle, String companyName);

    void sendStatusUpdate(String toEmail, String studentName,
                          String jobTitle, String companyName,
                          ApplicationStatus status);

    void sendNewJobAlert(String toEmail, String studentName,
                         String jobTitle, String companyName,
                         String location, String salaryPackage,
                         String deadline);

    void sendPasswordReset(String toEmail, String name, String resetLink);
}
