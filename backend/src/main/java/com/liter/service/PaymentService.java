package com.liter.service;

import com.liter.model.Bill;
import com.liter.model.Customer;
import com.liter.model.Payment;
import com.liter.repository.BillRepository;
import com.liter.repository.CustomerRepository;
import com.liter.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class PaymentService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BillRepository billRepository;

    @Transactional
    public Payment recordPayment(Long customerId, LocalDate paymentDate, BigDecimal amount, String method, String referenceNumber, String notes) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        // 1. Record the Payment in database
        Payment payment = new Payment();
        payment.setCustomer(customer);
        payment.setPaymentDate(paymentDate);
        payment.setAmount(amount);
        payment.setPaymentMethod(method);
        payment.setReferenceNumber(referenceNumber);
        payment.setNotes(notes);

        Payment savedPayment = paymentRepository.save(payment);

        // 2. Allocate payment amount to unpaid bills (FIFO: oldest first)
        List<Bill> unpaidBills = billRepository
                .findByCustomerIdAndStatusNotOrderByBillPeriodStartAsc(customerId, "PAID");

        BigDecimal remainingPayment = amount;

        for (Bill bill : unpaidBills) {
            if (remainingPayment.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            BigDecimal outstanding = bill.getOutstandingAmount();

            if (remainingPayment.compareTo(outstanding) >= 0) {
                // Settle the bill completely
                bill.setPaidAmount(bill.getTotalAmount());
                bill.setOutstandingAmount(BigDecimal.ZERO);
                bill.setStatus("PAID");

                remainingPayment = remainingPayment.subtract(outstanding);
                billRepository.save(bill);
            } else {
                // Partially pay the bill
                BigDecimal newPaidAmount = bill.getPaidAmount().add(remainingPayment);
                bill.setPaidAmount(newPaidAmount);
                bill.setOutstandingAmount(bill.getTotalAmount().subtract(newPaidAmount));
                bill.setStatus("PARTIALLY_PAID");

                remainingPayment = BigDecimal.ZERO;
                billRepository.save(bill);
                break; // Payment completely exhausted
            }
        }

        return savedPayment;
    }
}
