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

    @GetMapping("/sheet")
    public ResponseEntity<List<DeliverySheetItem>> getDeliverySheet(
            @RequestParam String date,
            @RequestParam String session) {

        LocalDate localDate = LocalDate.parse(date);
        String activeSession = session.toUpperCase();

        // 1. Fetch active customers
        List<Customer> activeCustomers = customerRepository.findByStatus("ACTIVE");
        List<DeliverySheetItem> sheet = new ArrayList<>();

        for (Customer customer : activeCustomers) {
            // 2. Fetch default subscription configurations for the customer
            List<CustomerProductConfig> configs = customerProductConfigRepository
                    .findByCustomerIdAndActive(customer.getId(), true);

            for (CustomerProductConfig config : configs) {
                // Determine default quantity for this session
                BigDecimal defaultQty = activeSession.equals("MORNING") 
                        ? config.getDefaultQtyMorning() 
                        : config.getDefaultQtyEvening();

                // If customer is not configured to receive this product in this session, skip it
                if (defaultQty == null || defaultQty.compareTo(BigDecimal.ZERO) == 0) {
                    continue;
                }

                Product product = config.getProduct();

                // 3. Check if a delivery transaction is already saved in the database
                Optional<DeliveryTransaction> existingOpt = deliveryTransactionRepository
                        .findByCustomerIdAndProductIdAndDeliveryDateAndSession(
                                customer.getId(), product.getId(), localDate, activeSession);

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
                    // Fallback to defaults
                    BigDecimal price = config.getCustomPrice() != null 
                            ? config.getCustomPrice() 
                            : product.getDefaultPrice();

                    sheet.add(new DeliverySheetItem(
                            customer.getId(),
                            customer.getName(),
                            product.getId(),
                            product.getName(),
                            defaultQty,
                            defaultQty, // Quantity defaults to standard subscription qty
                            product.getUnit(),
                            price,
                            "DELIVERED", // Default status is DELIVERED
                            ""
                    ));
                }
            }
        }

        return ResponseEntity.ok(sheet);
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
            String activeSession = payload.get("session").toString().toUpperCase();
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
                    .findByCustomerIdAndProductIdAndDeliveryDateAndSession(customerId, productId, date, activeSession)
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
