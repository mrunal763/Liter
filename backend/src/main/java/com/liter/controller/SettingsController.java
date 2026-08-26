package com.liter.controller;

import com.liter.model.DairyProfile;
import com.liter.repository.DairyProfileRepository;
import com.liter.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private DairyProfileRepository dairyProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<DairyProfile> getProfile() {
        List<DairyProfile> profiles = dairyProfileRepository.findAll();
        if (profiles.isEmpty()) {
            // Seed a default profile
            DairyProfile defaultProfile = new DairyProfile();
            defaultProfile.setBusinessName("Sachi Dudh Ganga");
            defaultProfile.setOwnerName("Mrunal");
            defaultProfile.setMobileNumber("9876543210");
            defaultProfile.setUpiId("sachidudhganga@upi");
            defaultProfile.setAddress("Krishna Farm, Pune");
            
            DairyProfile saved = dairyProfileRepository.save(defaultProfile);
            return ResponseEntity.ok(saved);
        }
        return ResponseEntity.ok(profiles.get(0));
    }

    @PostMapping("/profile")
    public ResponseEntity<DairyProfile> saveProfile(@Valid @RequestBody DairyProfile profileDetails) {
        List<DairyProfile> profiles = dairyProfileRepository.findAll();
        DairyProfile profile;
        if (profiles.isEmpty()) {
            profile = new DairyProfile();
        } else {
            profile = profiles.get(0);
        }

        profile.setBusinessName(profileDetails.getBusinessName());
        profile.setOwnerName(profileDetails.getOwnerName());
        profile.setMobileNumber(profileDetails.getMobileNumber());
        profile.setAddress(profileDetails.getAddress());
        profile.setUpiId(profileDetails.getUpiId());

        DairyProfile saved = dairyProfileRepository.save(profile);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/account")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteAccount(Principal principal) {
        if (principal != null) {
            userRepository.findByUsername(principal.getName()).ifPresent(userRepository::delete);
        }
        dairyProfileRepository.deleteAll();
        return ResponseEntity.ok("Account deleted successfully");
    }
}

