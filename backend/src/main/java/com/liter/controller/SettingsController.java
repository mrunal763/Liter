package com.liter.controller;

import com.liter.model.DairyProfile;
import com.liter.model.User;
import com.liter.repository.DairyProfileRepository;
import com.liter.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.Optional;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private DairyProfileRepository dairyProfileRepository;

    @Autowired
    private UserRepository userRepository;

    private User resolveCurrentUser(Principal principal) {
        if (principal != null) {
            return userRepository.findByUsername(principal.getName()).orElse(null);
        }
        return null;
    }

    @GetMapping({"", "/profile"})
    public ResponseEntity<DairyProfile> getProfile(Principal principal) {
        User currentUser = resolveCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<DairyProfile> opt = dairyProfileRepository.findByUser(currentUser);
        if (opt.isPresent()) {
            return ResponseEntity.ok(opt.get());
        }

        // If no profile exists for this specific user yet, create a default one
        DairyProfile newProfile = new DairyProfile();
        newProfile.setUser(currentUser);
        newProfile.setOwnerName(currentUser.getFullName() != null ? currentUser.getFullName() : currentUser.getUsername());
        newProfile.setBusinessName("Liter Dairy");
        
        DairyProfile saved = dairyProfileRepository.save(newProfile);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/profile")
    public ResponseEntity<DairyProfile> saveProfile(@Valid @RequestBody DairyProfile profileDetails, Principal principal) {
        User currentUser = resolveCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        DairyProfile profile = dairyProfileRepository.findByUser(currentUser)
                .orElseGet(() -> {
                    DairyProfile p = new DairyProfile();
                    p.setUser(currentUser);
                    return p;
                });

        if (profileDetails.getBusinessName() != null && !profileDetails.getBusinessName().trim().isEmpty()) {
            profile.setBusinessName(profileDetails.getBusinessName().trim());
        }
        if (profileDetails.getOwnerName() != null && !profileDetails.getOwnerName().trim().isEmpty()) {
            profile.setOwnerName(profileDetails.getOwnerName().trim());
        }
        profile.setMobileNumber(profileDetails.getMobileNumber());
        profile.setAddress(profileDetails.getAddress());
        profile.setUpiId(profileDetails.getUpiId());

        DairyProfile saved = dairyProfileRepository.save(profile);

        // Also update currentUser fullName if ownerName changed
        if (profile.getOwnerName() != null && !profile.getOwnerName().equalsIgnoreCase(currentUser.getFullName())) {
            currentUser.setFullName(profile.getOwnerName());
            userRepository.save(currentUser);
        }

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/account")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteAccount(Principal principal) {
        User currentUser = resolveCurrentUser(principal);
        if (currentUser != null) {
            dairyProfileRepository.deleteByUser(currentUser);
            userRepository.delete(currentUser);
            return ResponseEntity.ok("Account deleted successfully");
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}

