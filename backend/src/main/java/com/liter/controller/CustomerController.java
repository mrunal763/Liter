package com.liter.controller;

import com.liter.dto.CustomerConfigDto;
import com.liter.model.Customer;
import com.liter.model.CustomerPriceHistory;
import com.liter.model.CustomerProductConfig;
import com.liter.model.Product;
import com.liter.repository.CustomerPriceHistoryRepository;
import com.liter.repository.CustomerProductConfigRepository;
import com.liter.repository.CustomerRepository;
import com.liter.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerProductConfigRepository customerProductConfigRepository;

    @Autowired
    private CustomerPriceHistoryRepository customerPriceHistoryRepository;

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers(@RequestParam(required = false) String status) {
        if (status != null && !status.trim().isEmpty()) {
            return ResponseEntity.ok(customerRepository.findByStatus(status.toUpperCase()));
        }
        return ResponseEntity.ok(customerRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@Valid @RequestBody Customer customer) {
        if (customer.getName() == null || customer.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (customer.getStartDate() == null) {
            customer.setStartDate(LocalDate.now());
        }
        Customer saved = customerRepository.save(customer);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @Valid @RequestBody Customer customerDetails) {
        return customerRepository.findById(id).map(customer -> {
            customer.setName(customerDetails.getName());
            customer.setMobileNumber(customerDetails.getMobileNumber());
            customer.setAddress(customerDetails.getAddress());
            customer.setVillage(customerDetails.getVillage());
            customer.setLandmark(customerDetails.getLandmark());
            customer.setStartDate(customerDetails.getStartDate());
            customer.setNotes(customerDetails.getNotes());
            customer.setStatus(customerDetails.getStatus());
            
            Customer updated = customerRepository.save(customer);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Customer> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equals("ACTIVE") && !newStatus.equals("INACTIVE"))) {
            return ResponseEntity.badRequest().build();
        }

        return customerRepository.findById(id).map(customer -> {
            customer.setStatus(newStatus);
            Customer updated = customerRepository.save(customer);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ------------------------------------------------------------------------
    // Customer Product Configuration & Specific Pricing (Transactional)
    // ------------------------------------------------------------------------

    @GetMapping("/{id}/configs")
    public ResponseEntity<List<CustomerConfigDto>> getCustomerConfigs(@PathVariable Long id) {
        if (!customerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        List<CustomerProductConfig> configs = customerProductConfigRepository.findByCustomerId(id);
        List<Product> allActiveProducts = productRepository.findByActive(true);
        List<CustomerConfigDto> dtoList = new ArrayList<>();

        for (Product product : allActiveProducts) {
            // Find existing config or return a default blank one
            CustomerProductConfig match = configs.stream()
                    .filter(c -> c.getProduct().getId().equals(product.getId()))
                    .findFirst()
                    .orElse(null);

            if (match != null) {
                dtoList.add(new CustomerConfigDto(
                        product.getId(),
                        match.getDefaultQtyMorning(),
                        match.getDefaultQtyEvening(),
                        match.getCustomPrice(),
                        match.isActive()
                ));
            } else {
                dtoList.add(new CustomerConfigDto(
                        product.getId(),
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        null,
                        true
                ));
            }
        }

        return ResponseEntity.ok(dtoList);
    }

    @PutMapping("/{customerId}/configs/{productId}")
    @Transactional
    public ResponseEntity<CustomerConfigDto> updateCustomerConfig(
            @PathVariable Long customerId,
            @PathVariable Long productId,
            @RequestBody CustomerConfigDto configDto) {

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        // Find existing config or create new one
        CustomerProductConfig config = customerProductConfigRepository
                .findByCustomerIdAndProductId(customerId, productId)
                .orElseGet(() -> {
                    CustomerProductConfig newConfig = new CustomerProductConfig();
                    newConfig.setCustomer(customer);
                    newConfig.setProduct(product);
                    return newConfig;
                });

        // Detect if the custom price is changing to audit price history
        BigDecimal oldPrice = config.getCustomPrice();
        BigDecimal newPrice = configDto.getCustomPrice();
        boolean priceChanged = false;

        if (oldPrice == null && newPrice != null) {
            priceChanged = true;
        } else if (oldPrice != null && newPrice == null) {
            priceChanged = true;
        } else if (oldPrice != null && newPrice != null && oldPrice.compareTo(newPrice) != 0) {
            priceChanged = true;
        }

        if (priceChanged) {
            // Cap the previous current price (endDate = yesterday)
            customerPriceHistoryRepository
                    .findFirstByCustomerIdAndProductIdAndEndDateIsNull(customerId, productId)
                    .ifPresent(history -> {
                        history.setEndDate(LocalDate.now().minusDays(1));
                        customerPriceHistoryRepository.save(history);
                    });

            // If new custom price is set, save a new history entry starting today
            if (newPrice != null) {
                CustomerPriceHistory newHistory = new CustomerPriceHistory();
                newHistory.setCustomer(customer);
                newHistory.setProduct(product);
                newHistory.setPrice(newPrice);
                newHistory.setStartDate(LocalDate.now());
                newHistory.setEndDate(null);
                customerPriceHistoryRepository.save(newHistory);
            }
        }

        // Apply changes
        config.setDefaultQtyMorning(configDto.getDefaultQtyMorning());
        config.setDefaultQtyEvening(configDto.getDefaultQtyEvening());
        config.setCustomPrice(newPrice);
        config.setActive(configDto.isActive());

        CustomerProductConfig saved = customerProductConfigRepository.save(config);

        return ResponseEntity.ok(new CustomerConfigDto(
                product.getId(),
                saved.getDefaultQtyMorning(),
                saved.getDefaultQtyEvening(),
                saved.getCustomPrice(),
                saved.isActive()
        ));
    }
}
