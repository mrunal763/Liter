package com.liter.controller;

import com.liter.dto.BillGenerationRequest;
import com.liter.model.Bill;
import com.liter.model.BillItem;
import com.liter.model.Customer;
import com.liter.model.DeliveryTransaction;
import com.liter.model.User;
import com.liter.repository.BillItemRepository;
import com.liter.repository.BillRepository;
import com.liter.repository.CustomerRepository;
import com.liter.repository.DeliveryTransactionRepository;
import com.liter.repository.UserRepository;
import com.liter.service.BillingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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

    @Autowired
    private DeliveryTransactionRepository deliveryTransactionRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(java.security.Principal principal) {
        if (principal == null) return null;
        return userRepository.findByUsername(principal.getName()).orElse(null);
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateBills(@RequestBody BillGenerationRequest request, java.security.Principal principal) {
        User currentUser = getCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated.");
        }

        if (request.getStartDate() == null || request.getEndDate() == null) {
            return ResponseEntity.badRequest().body("Start Date and End Date are required.");
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            return ResponseEntity.badRequest().body("End Date cannot be before Start Date.");
        }

        List<Bill> generatedBills = new ArrayList<>();

        if (request.getCustomerId() != null) {
            // Generate for a single specific customer belonging to the authenticated user
            try {
                Bill bill = billingService.generateBillForCustomer(
                        request.getCustomerId(), request.getStartDate(), request.getEndDate(), currentUser);
                generatedBills.add(bill);
            } catch (SecurityException se) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(se.getMessage());
            } catch (Exception e) {
                // Return generated bills list if skipped due to zero transactions
            }
        } else {
            // Bulk Generate for ALL customers belonging strictly to the current authenticated user
            List<Customer> userCustomers = customerRepository.findByUser(currentUser);
            for (Customer customer : userCustomers) {
                try {
                    Bill bill = billingService.generateBillForCustomer(
                            customer.getId(), request.getStartDate(), request.getEndDate(), currentUser);
                    generatedBills.add(bill);
                } catch (Exception e) {
                    // Skip if customer has no deliveries for this period
                }
            }
        }

        return ResponseEntity.ok(generatedBills);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getBillingHistory(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end,
            @RequestParam(required = false) Long customerId,
            java.security.Principal principal) {

        User currentUser = getCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated.");
        }

        List<Bill> bills;

        if (start != null && end != null && !start.trim().isEmpty() && !end.trim().isEmpty()) {
            LocalDate startDate = LocalDate.parse(start);
            LocalDate endDate = LocalDate.parse(end);
            
            if (endDate.isBefore(startDate)) {
                return ResponseEntity.badRequest().body("End Date cannot be before Start Date.");
            }

            bills = billRepository.findByCustomerUserIdAndBillPeriodStartGreaterThanEqualAndBillPeriodEndLessThanEqual(
                    currentUser.getId(), startDate, endDate);
        } else {
            bills = billRepository.findByCustomerUserId(currentUser.getId());
        }

        // Apply customerId filter if specified
        if (customerId != null) {
            bills = bills.stream()
                    .filter(b -> b.getCustomer() != null && b.getCustomer().getId().equals(customerId))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(bills);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBillById(@PathVariable Long id, java.security.Principal principal) {
        User currentUser = getCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Bill bill = billRepository.findById(id).orElse(null);
        if (bill == null) {
            return ResponseEntity.notFound().build();
        }

        // Strict multi-tenant security verification
        if (bill.getCustomer() != null && bill.getCustomer().getUser() != null && 
            !bill.getCustomer().getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        return ResponseEntity.ok(bill);
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<?> getBillItems(@PathVariable Long id, java.security.Principal principal) {
        User currentUser = getCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Bill bill = billRepository.findById(id).orElse(null);
        if (bill == null) {
            return ResponseEntity.notFound().build();
        }

        if (bill.getCustomer() != null && bill.getCustomer().getUser() != null && 
            !bill.getCustomer().getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        List<BillItem> items = billItemRepository.findByBillId(id);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}/daywise")
    public ResponseEntity<?> getBillDaywiseTransactions(@PathVariable Long id, java.security.Principal principal) {
        User currentUser = getCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Bill bill = billRepository.findById(id).orElse(null);
        if (bill == null) {
            return ResponseEntity.notFound().build();
        }

        // Strict multi-tenant security verification
        if (bill.getCustomer() != null && bill.getCustomer().getUser() != null && 
            !bill.getCustomer().getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        // Load all delivered transactions chronologically sorted (Date ASC, Product ASC)
        List<DeliveryTransaction> transactions = deliveryTransactionRepository
                .findByCustomerIdAndDeliveryDateBetweenAndStatus(
                        bill.getCustomer().getId(),
                        bill.getBillPeriodStart(),
                        bill.getBillPeriodEnd(),
                        "DELIVERED"
                );

        transactions.sort(Comparator
                .comparing(DeliveryTransaction::getDeliveryDate)
                .thenComparing(t -> t.getProduct() != null ? t.getProduct().getName() : ""));

        return ResponseEntity.ok(transactions);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteBill(@PathVariable Long id, Principal principal) {
        User currentUser = getCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        billItemRepository.deleteByBillId(id);
        int deletedCount = billRepository.deleteByIdAndCustomerUserId(id, currentUser.getId());

        if (deletedCount == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Bill not found or access denied.");
        }
        return ResponseEntity.ok(java.util.Map.of("message", "Bill deleted successfully."));
    }

    @DeleteMapping("/all")
    @Transactional
    public ResponseEntity<?> deleteAllBills(Principal principal) {
        User currentUser = getCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        billItemRepository.deleteByBillCustomerUserId(currentUser.getId());
        billRepository.deleteByCustomerUserId(currentUser.getId());
        return ResponseEntity.ok(java.util.Map.of("message", "All bills deleted successfully."));
    }
}
