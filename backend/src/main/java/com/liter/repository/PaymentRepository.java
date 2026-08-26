package com.liter.repository;

import com.liter.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByCustomerId(Long customerId);
    List<Payment> findByCustomerIdOrderByPaymentDateDesc(Long customerId);
    List<Payment> findByPaymentDateBetween(LocalDate start, LocalDate end);
}
