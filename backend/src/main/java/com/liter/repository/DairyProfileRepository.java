package com.liter.repository;

import com.liter.model.DairyProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import com.liter.model.User;
import java.util.Optional;

public interface DairyProfileRepository extends JpaRepository<DairyProfile, Long> {
    Optional<DairyProfile> findByUser(User user);
    void deleteByUser(User user);
}
