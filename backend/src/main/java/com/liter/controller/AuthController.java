package com.liter.controller;

import com.liter.dto.LoginRequest;
import com.liter.dto.LoginResponse;
import com.liter.dto.UserResponse;
import com.liter.model.User;
import com.liter.repository.UserRepository;
import com.liter.security.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private com.liter.repository.DairyProfileRepository dairyProfileRepository;

    @PostMapping("/register")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> registerUser(@Valid @RequestBody com.liter.dto.RegisterRequest registerRequest) {
        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        // Create new user's account
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setEmail(registerRequest.getEmail());
        user.setFullName(registerRequest.getFullName());
        user.setRole("ROLE_OWNER");
        user.setActive(true);

        User savedUser = userRepository.save(user);

        // Seed profile settings
        com.liter.model.DairyProfile profile = new com.liter.model.DairyProfile();
        profile.setBusinessName(registerRequest.getBusinessName());
        profile.setOwnerName(registerRequest.getFullName());
        profile.setUser(savedUser);
        dairyProfileRepository.save(profile);

        return ResponseEntity.ok(new UserResponse(savedUser.getUsername(), savedUser.getEmail(), savedUser.getFullName(), savedUser.getRole()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        String username = loginRequest.getUsername() != null ? loginRequest.getUsername().trim() : "";
        String password = loginRequest.getPassword() != null ? loginRequest.getPassword() : "";

        System.out.println(">>> LOGIN ATTEMPT for username: '" + username + "'");

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByUsernameIgnoreCase(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

            String jwt = jwtUtils.generateToken(user.getUsername());

            System.out.println(">>> LOGIN SUCCESSFUL for user: " + user.getUsername());
            return ResponseEntity.ok(new LoginResponse(jwt, user.getUsername(), user.getFullName()));
        } catch (Exception e) {
            System.err.println(">>> LOGIN FAILED for user '" + username + "': " + e.getClass().getName() + " - " + e.getMessage());
            return ResponseEntity.status(401).body("Login failed for user '" + username + "': " + e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + principal.getName()));

        return ResponseEntity.ok(new UserResponse(user.getUsername(), user.getEmail(), user.getFullName(), user.getRole()));
    }
}
