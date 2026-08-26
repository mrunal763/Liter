package com.liter.controller;

import com.liter.dto.PaymentRequest;
import com.liter.model.Payment;
import com.liter.repository.PaymentRepository;
import com.liter.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentRepository paymentRepository;

    @PostMapping
    public ResponseEntity<Payment> recordPayment(@Valid @RequestBody PaymentRequest request) {
        if (request.getCustomerId() == null || request.getAmount() == null) {
            return ResponseEntity.badRequest().build();
        }

        Payment payment = paymentService.recordPayment(
                request.getCustomerId(),
                request.getPaymentDate(),
                request.getAmount(),
                request.getPaymentMethod(),
                request.getReferenceNumber(),
                request.getNotes()
        );

        return ResponseEntity.ok(payment);
    }

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments(@RequestParam(required = false) Long customerId) {
        if (customerId != null) {
            return ResponseEntity.ok(paymentRepository.findByCustomerIdOrderByPaymentDateDesc(customerId));
        }
        return ResponseEntity.ok(paymentRepository.findAll());
    }
}
