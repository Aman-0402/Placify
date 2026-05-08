package com.placify.service.impl;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.placify.dto.auth.AuthResponse;
import com.placify.dto.auth.LoginRequest;
import com.placify.dto.auth.RegisterRequest;
import com.placify.dto.user.UserResponse;
import com.placify.entity.Student;
import com.placify.entity.User;
import com.placify.enums.Role;
import com.placify.exception.BadRequestException;
import com.placify.exception.ResourceNotFoundException;
import com.placify.repository.StudentRepository;
import com.placify.repository.UserRepository;
import com.placify.security.JwtUtil;
import com.placify.service.AuthService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (request.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be created through public registration");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("User email already exists");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setEnabled(true);
        User savedUser = userRepository.save(user);

        if (savedUser.getRole() == Role.STUDENT) {
            validateStudentRegistration(request);
            Student student = new Student();
            student.setUser(savedUser);
            student.setSkills(request.getSkills().trim());
            student.setResume(request.getResume().trim());
            student.setBranch(request.getBranch().trim());
            Student savedStudent = studentRepository.save(student);
            savedUser.setStudent(savedStudent);
        }

        return buildAuthResponse(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return buildAuthResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapUser(user);
    }

    private void validateStudentRegistration(RegisterRequest request) {
        if (isBlank(request.getSkills()) || isBlank(request.getResume()) || isBlank(request.getBranch())) {
            throw new BadRequestException("Skills, resume, and branch are required for student registration");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .token(jwtUtil.generateToken(user))
                .tokenType("Bearer")
                .user(mapUser(user))
                .build();
    }

    private UserResponse mapUser(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .studentId(user.getStudent() != null ? user.getStudent().getId() : null)
                .build();
    }
}
