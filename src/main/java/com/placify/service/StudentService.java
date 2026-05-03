package com.placify.service;

import java.util.List;

import com.placify.dto.student.StudentProfileUpdateRequest;
import com.placify.dto.student.StudentRequest;
import com.placify.dto.student.StudentResponse;

public interface StudentService {

    StudentResponse createStudent(StudentRequest request);

    List<StudentResponse> getAllStudents();

    StudentResponse getStudentById(Long studentId);

    StudentResponse getOwnProfile(String email);

    StudentResponse updateStudent(Long studentId, StudentRequest request);

    StudentResponse updateOwnProfile(String email, StudentProfileUpdateRequest request);

    void deleteStudent(Long studentId);
}
