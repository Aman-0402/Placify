package com.placify.service;

import com.placify.dto.auth.AuthResponse;
import com.placify.dto.auth.LoginRequest;
import com.placify.dto.auth.RegisterRequest;
import com.placify.dto.user.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(String email);
}
