package com.liter.controller;

import com.liter.dto.BillGenerationRequest;
import com.liter.model.Bill;
import com.liter.model.BillItem;
import com.liter.model.Customer;
import com.liter.repository.BillItemRepository;
import com.liter.repository.BillRepository;
import com.liter.repository.CustomerRepository;
import com.liter.service.BillingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    @Autowired
    private BillingService billingService;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private BillItemRepository billItemRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @PostMapping("/generate")
    public ResponseEntity<List<Bill>> generateBills(@RequestBody BillGenerationRequest request) {
        if (request.getStartDate() == null || request.getEndDate() == null) {
            return ResponseEntity.badRequest().build();
        }

        List<Bill> generatedBills = new ArrayList<>();

        if (request.getCustomerId() != null) {
            // Generate for specific customer
            try {
                Bill bill = billingService.generateBillForCustomer(
                        request.getCustomerId(), request.getStartDate(), request.getEndDate());
                generatedBills.add(bill);
            } catch (IllegalStateException e) {
                // Return success but with empty list or error details if no transactions
                return ResponseEntity.ok(generatedBills);
            }
        } else {
            // Generate for all active customers
            List<Customer> activeCustomers = customerRepository.findByStatus("ACTIVE");
            for (Customer customer : activeCustomers) {
                try {
                    Bill bill = billingService.generateBillForCustomer(
                            customer.getId(), request.getStartDate(), request.getEndDate());
                    generatedBills.add(bill);
                } catch (IllegalStateException e) {
                    // Skip if customer has no deliveries for this period
                }
            }
        }

        return ResponseEntity.ok(generatedBills);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Bill>> getBillingHistory(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end) {

        if (start != null && end != null) {
            LocalDate startDate = LocalDate.parse(start);
            LocalDate endDate = LocalDate.parse(end);
            return ResponseEntity.ok(billRepository.findByBillPeriodStartGreaterThanEqualAndBillPeriodEndLessThanEqual(startDate, endDate));
        }

        return ResponseEntity.ok(billRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bill> getBillById(@PathVariable Long id) {
        return billRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<List<BillItem>> getBillItems(@PathVariable Long id) {
        if (!billRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(billItemRepository.findByBillId(id));
    }
}
