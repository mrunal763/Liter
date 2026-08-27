package com.liter.controller;

import com.liter.dto.DeliverySheetItem;
import com.liter.model.Customer;
import com.liter.model.CustomerProductConfig;
import com.liter.model.DeliveryTransaction;
import com.liter.model.Product;
import com.liter.repository.CustomerProductConfigRepository;
import com.liter.repository.CustomerRepository;
import com.liter.repository.DeliveryTransactionRepository;
import com.liter.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import com.liter.model.User;
import com.liter.repository.UserRepository;
import java.security.Principal;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerProductConfigRepository customerProductConfigRepository;

    @Autowired
    private DeliveryTransactionRepository deliveryTransactionRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByUsername(principal.getName()).orElse(null);
    }

    private List<Customer> getActiveCustomersForDate(User currentUser, LocalDate localDate) {
        if (currentUser == null) {
            return new ArrayList<>();
        }
        return customerRepository.findByUserAndStartDateLessThanEqual(currentUser, localDate);
    }

    @GetMapping("/sheet")
    public ResponseEntity<List<DeliverySheetItem>> getDeliverySheet(
            @RequestParam String date,
            @RequestParam(required = false, defaultValue = "DAILY") String session,
            Principal principal) {

        LocalDate localDate = LocalDate.parse(date);
        User currentUser = getCurrentUser(principal);

        // 1. Fetch active customers created on or before the selected delivery date
        List<Customer> activeCustomers = getActiveCustomersForDate(currentUser, localDate);

        List<DeliverySheetItem> sheet = new ArrayList<>();
        List<Product> allActiveProducts = productRepository.findByActive(true);

        for (Customer customer : activeCustomers) {
            // 2. Fetch default subscription configurations for the customer
            List<CustomerProductConfig> configs = customerProductConfigRepository
                    .findByCustomerIdAndActive(customer.getId(), true);

            if (configs.isEmpty()) {
                // Fallback: If no config exists yet, show all active products for customer
                for (Product product : allActiveProducts) {
                    BigDecimal defaultQty = new BigDecimal("1.00");
                    BigDecimal price = product.getDefaultPrice();

                    Optional<DeliveryTransaction> existingOpt = deliveryTransactionRepository
                            .findByCustomerIdAndProductIdAndDeliveryDate(customer.getId(), product.getId(), localDate);

                    if (existingOpt.isPresent()) {
                        DeliveryTransaction transaction = existingOpt.get();
                        sheet.add(new DeliverySheetItem(
                                customer.getId(),
                                customer.getName(),
                                product.getId(),
                                product.getName(),
                                defaultQty,
                                transaction.getQuantity(),
                                transaction.getUnit(),
                                transaction.getAppliedPrice(),
                                transaction.getStatus(),
                                transaction.getNotes()
                        ));
                    } else {
                        sheet.add(new DeliverySheetItem(
                                customer.getId(),
                                customer.getName(),
                                product.getId(),
                                product.getName(),
                                defaultQty,
                                defaultQty,
                                product.getUnit(),
                                price,
                                "UNMARKED",
                                ""
                        ));
                    }
                }
            } else {
                for (CustomerProductConfig config : configs) {
                    BigDecimal defaultQty = config.getDefaultQuantity();
                    if (defaultQty == null || defaultQty.compareTo(BigDecimal.ZERO) <= 0) {
                        defaultQty = new BigDecimal("1.00");
                    }

                    Product product = config.getProduct();

                    Optional<DeliveryTransaction> existingOpt = deliveryTransactionRepository
                            .findByCustomerIdAndProductIdAndDeliveryDate(customer.getId(), product.getId(), localDate);

                    if (existingOpt.isPresent()) {
                        DeliveryTransaction transaction = existingOpt.get();
                        sheet.add(new DeliverySheetItem(
                                customer.getId(),
                                customer.getName(),
                                product.getId(),
                                product.getName(),
                                defaultQty,
                                transaction.getQuantity(),
                                transaction.getUnit(),
                                transaction.getAppliedPrice(),
                                transaction.getStatus(),
                                transaction.getNotes()
                        ));
                    } else {
                        BigDecimal price = config.getCustomPrice() != null 
                                ? config.getCustomPrice() 
                                : product.getDefaultPrice();

                        sheet.add(new DeliverySheetItem(
                                customer.getId(),
                                customer.getName(),
                                product.getId(),
                                product.getName(),
                                defaultQty,
                                defaultQty,
                                product.getUnit(),
                                price,
                                "UNMARKED",
                                ""
                        ));
                    }
                }
            }
        }

        // 4. Fetch any additional saved transactions for this date
        List<DeliveryTransaction> allSaved = deliveryTransactionRepository
                .findByDeliveryDate(localDate);

        for (DeliveryTransaction dt : allSaved) {
            boolean alreadyAdded = sheet.stream().anyMatch(item ->
                item.getCustomerId().equals(dt.getCustomer().getId()) &&
                item.getProductId().equals(dt.getProduct().getId())
            );

            if (!alreadyAdded) {
                sheet.add(new DeliverySheetItem(
                        dt.getCustomer().getId(),
                        dt.getCustomer().getName(),
                        dt.getProduct().getId(),
                        dt.getProduct().getName(),
                        BigDecimal.ZERO,
                        dt.getQuantity(),
                        dt.getUnit(),
                        dt.getAppliedPrice(),
                        dt.getStatus(),
                        dt.getNotes()
                ));
            }
        }

        return ResponseEntity.ok(sheet);
    }

    @PostMapping("/mark-all-present")
    @Transactional
    public ResponseEntity<List<DeliveryTransaction>> markAllPresent(
            @RequestParam String date,
            @RequestParam(required = false, defaultValue = "DAILY") String session,
            Principal principal) {

        LocalDate localDate = LocalDate.parse(date);
        User currentUser = getCurrentUser(principal);

        List<Customer> activeCustomers = getActiveCustomersForDate(currentUser, localDate);

        List<DeliveryTransaction> savedTransactions = new ArrayList<>();

        for (Customer customer : activeCustomers) {
            List<CustomerProductConfig> configs = customerProductConfigRepository
                    .findByCustomerIdAndActive(customer.getId(), true);

            for (CustomerProductConfig config : configs) {
                BigDecimal defaultQty = config.getDefaultQuantity();

                if (defaultQty == null || defaultQty.compareTo(BigDecimal.ZERO) == 0) {
                    continue;
                }

                Product product = config.getProduct();
                BigDecimal appliedPrice = config.getCustomPrice() != null 
                        ? config.getCustomPrice() 
                        : product.getDefaultPrice();

                DeliveryTransaction transaction = deliveryTransactionRepository
                        .findByCustomerIdAndProductIdAndDeliveryDate(customer.getId(), product.getId(), localDate)
                        .orElseGet(() -> {
                            DeliveryTransaction t = new DeliveryTransaction();
                            t.setCustomer(customer);
                            t.setProduct(product);
                            t.setDeliveryDate(localDate);
                            t.setSession("DAILY");
                            return t;
                        });

                transaction.setQuantity(defaultQty);
                transaction.setUnit(product.getUnit());
                transaction.setAppliedPrice(appliedPrice);
                transaction.setTotalAmount(defaultQty.multiply(appliedPrice));
                transaction.setStatus("DELIVERED");
                if (transaction.getNotes() == null) transaction.setNotes("");

                savedTransactions.add(deliveryTransactionRepository.save(transaction));
            }
        }

        return ResponseEntity.ok(savedTransactions);
    }

    @PostMapping("/mark-all-absent")
    @Transactional
    public ResponseEntity<List<DeliveryTransaction>> markAllAbsent(
            @RequestParam String date,
            @RequestParam(required = false, defaultValue = "DAILY") String session,
            Principal principal) {

        LocalDate localDate = LocalDate.parse(date);
        User currentUser = getCurrentUser(principal);

        List<Customer> activeCustomers = getActiveCustomersForDate(currentUser, localDate);

        List<DeliveryTransaction> savedTransactions = new ArrayList<>();

        for (Customer customer : activeCustomers) {
            List<CustomerProductConfig> configs = customerProductConfigRepository
                    .findByCustomerIdAndActive(customer.getId(), true);

            for (CustomerProductConfig config : configs) {
                BigDecimal defaultQty = config.getDefaultQuantity();

                if (defaultQty == null || defaultQty.compareTo(BigDecimal.ZERO) == 0) {
                    continue;
                }

                Product product = config.getProduct();
                BigDecimal appliedPrice = config.getCustomPrice() != null 
                        ? config.getCustomPrice() 
                        : product.getDefaultPrice();

                DeliveryTransaction transaction = deliveryTransactionRepository
                        .findByCustomerIdAndProductIdAndDeliveryDate(customer.getId(), product.getId(), localDate)
                        .orElseGet(() -> {
                            DeliveryTransaction t = new DeliveryTransaction();
                            t.setCustomer(customer);
                            t.setProduct(product);
                            t.setDeliveryDate(localDate);
                            t.setSession("DAILY");
                            return t;
                        });

                transaction.setQuantity(BigDecimal.ZERO);
                transaction.setUnit(product.getUnit());
                transaction.setAppliedPrice(appliedPrice);
                transaction.setTotalAmount(BigDecimal.ZERO);
                transaction.setStatus("SKIPPED");
                if (transaction.getNotes() == null) transaction.setNotes("Absent");

                savedTransactions.add(deliveryTransactionRepository.save(transaction));
            }
        }

        return ResponseEntity.ok(savedTransactions);
    }

    @GetMapping("/customer-history/{customerId}")
    public ResponseEntity<Map<String, Object>> getCustomerHistory(
            @PathVariable Long customerId,
            @RequestParam int year,
            @RequestParam int month) {

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        List<DeliveryTransaction> transactions = deliveryTransactionRepository
                .findByCustomerIdAndDeliveryDateBetween(customerId, startDate, endDate);

        // Group by delivery date string (YYYY-MM-DD)
        Map<String, List<DeliveryTransaction>> dateMap = transactions.stream()
                .collect(java.util.stream.Collectors.groupingBy(t -> t.getDeliveryDate().toString()));

        List<Map<String, Object>> dailyList = new ArrayList<>();
        int presentDays = 0;
        int absentDays = 0;
        int adjustedDays = 0;
        BigDecimal totalMonthVolume = BigDecimal.ZERO;

        for (Map.Entry<String, List<DeliveryTransaction>> entry : dateMap.entrySet()) {
            String dateStr = entry.getKey();
            List<DeliveryTransaction> dayTxList = entry.getValue();

            boolean hasDelivered = dayTxList.stream().anyMatch(t -> "DELIVERED".equalsIgnoreCase(t.getStatus()));
            boolean hasSkipped = dayTxList.stream().anyMatch(t -> "SKIPPED".equalsIgnoreCase(t.getStatus()));

            String dayStatus = hasDelivered ? "PRESENT" : (hasSkipped ? "ABSENT" : "UNMARKED");
            if ("PRESENT".equals(dayStatus)) presentDays++;
            else if ("ABSENT".equals(dayStatus)) absentDays++;

            BigDecimal dayVolume = BigDecimal.ZERO;
            List<Map<String, Object>> itemsList = new ArrayList<>();

            for (DeliveryTransaction t : dayTxList) {
                if ("DELIVERED".equalsIgnoreCase(t.getStatus())) {
                    dayVolume = dayVolume.add(t.getQuantity());
                    totalMonthVolume = totalMonthVolume.add(t.getQuantity());
                }

                Map<String, Object> itemMap = new java.util.HashMap<>();
                itemMap.put("productName", t.getProduct().getName());
                itemMap.put("quantity", t.getQuantity());
                itemMap.put("unit", t.getUnit());
                itemMap.put("appliedPrice", t.getAppliedPrice());
                itemMap.put("totalAmount", t.getTotalAmount());
                itemMap.put("status", t.getStatus());
                itemMap.put("notes", t.getNotes());
                itemsList.add(itemMap);
            }

            Map<String, Object> daySummary = new java.util.HashMap<>();
            daySummary.put("date", dateStr);
            daySummary.put("status", dayStatus);
            daySummary.put("dayVolume", dayVolume);
            daySummary.put("items", itemsList);
            dailyList.add(daySummary);
        }

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("customerId", customerId);
        result.put("year", year);
        result.put("month", month);
        result.put("presentDays", presentDays);
        result.put("absentDays", absentDays);
        result.put("adjustedDays", adjustedDays);
        result.put("totalMonthVolume", totalMonthVolume);
        result.put("days", dailyList);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/bulk")
    @Transactional
    public ResponseEntity<List<DeliveryTransaction>> saveBulkDeliveries(
            @RequestBody List<Map<String, Object>> payloadList) {

        List<DeliveryTransaction> savedTransactions = new ArrayList<>();

        for (Map<String, Object> payload : payloadList) {
            Long customerId = Long.valueOf(payload.get("customerId").toString());
            Long productId = Long.valueOf(payload.get("productId").toString());
            LocalDate date = LocalDate.parse(payload.get("deliveryDate").toString());
            String activeSession = payload.get("session") != null ? payload.get("session").toString().toUpperCase() : "DAILY";
            BigDecimal quantity = new BigDecimal(payload.get("quantity").toString());
            BigDecimal appliedPrice = new BigDecimal(payload.get("appliedPrice").toString());
            String status = payload.get("status").toString().toUpperCase();
            String notes = payload.get("notes") != null ? payload.get("notes").toString() : "";

            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

            // Find existing row or insert a new one (Upsert behavior)
            DeliveryTransaction transaction = deliveryTransactionRepository
                    .findByCustomerIdAndProductIdAndDeliveryDate(customerId, productId, date)
                    .orElseGet(() -> {
                        DeliveryTransaction t = new DeliveryTransaction();
                        t.setCustomer(customer);
                        t.setProduct(product);
                        t.setDeliveryDate(date);
                        t.setSession(activeSession);
                        return t;
                    });

            transaction.setQuantity(quantity);
            transaction.setUnit(product.getUnit());
            transaction.setAppliedPrice(appliedPrice);

            // Compute total secures on backend
            BigDecimal totalAmount = quantity.multiply(appliedPrice);
            transaction.setTotalAmount(totalAmount);
            transaction.setStatus(status);
            transaction.setNotes(notes);

            savedTransactions.add(deliveryTransactionRepository.save(transaction));
        }

        return ResponseEntity.ok(savedTransactions);
    }
}
