package com.liter.repository;

import com.liter.model.Customer;
import com.liter.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByUser(User user);
    List<Customer> findByUserAndStartDateLessThanEqual(User user, LocalDate date);
    List<Customer> findByUserAndStatus(User user, String status);
    List<Customer> findByUserAndStatusAndStartDateLessThanEqual(User user, String status, LocalDate date);
    Optional<Customer> findByIdAndUser(Long id, User user);
    Optional<Customer> findByNameIgnoreCaseAndUser(String name, User user);
    List<Customer> findByStatus(String status);
    List<Customer> findByStatusAndStartDateLessThanEqual(String status, LocalDate date);
    Optional<Customer> findByNameIgnoreCase(String name);
}

