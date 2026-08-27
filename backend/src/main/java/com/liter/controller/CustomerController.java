package com.liter.controller;

import com.liter.dto.CustomerConfigDto;
import com.liter.dto.CustomerSummaryDto;
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

import com.liter.model.User;
import com.liter.repository.UserRepository;
import java.security.Principal;

import com.liter.repository.BillItemRepository;
import com.liter.repository.BillRepository;
import com.liter.repository.DeliveryTransactionRepository;

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

    @Autowired
    private DeliveryTransactionRepository deliveryTransactionRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private BillItemRepository billItemRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByUsername(principal.getName()).orElse(null);
    }

    private boolean isMilkProduct(Product p) {
        if (p == null || p.getName() == null) return false;
        String name = p.getName().toLowerCase();
        String category = p.getCategory() != null ? p.getCategory().toLowerCase() : "";
        if (name.contains("milk") || category.contains("milk")) {
            return true;
        }
        if (name.contains("ghee") || name.contains("paneer") || name.contains("curd") || name.contains("butter") || name.contains("cheese") || name.contains("shrikhand") || name.contains("sweets")) {
            return false;
        }
        return true;
    }

    @GetMapping
    public ResponseEntity<List<CustomerSummaryDto>> getAllCustomers(Principal principal) {
        User currentUser = getCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.ok(new ArrayList<>());
        }
        List<Customer> customers = customerRepository.findByUser(currentUser);
        List<CustomerSummaryDto> result = new ArrayList<>();
        for (Customer c : customers) {
            CustomerSummaryDto dto = new CustomerSummaryDto();
            dto.setId(c.getId());
            dto.setName(c.getName());
            dto.setMobileNumber(c.getMobileNumber());
            dto.setAddress(c.getAddress());
            dto.setStartDate(c.getStartDate());
            dto.setNotes(c.getNotes());
            dto.setCreatedAt(c.getCreatedAt());
            // Enrich with all active milk subscriptions
            List<CustomerProductConfig> configs = customerProductConfigRepository.findByCustomerIdAndActive(c.getId(), true);
            List<com.liter.dto.CustomerSubscriptionDto> subList = new ArrayList<>();

            for (CustomerProductConfig cfg : configs) {
                if (cfg.getProduct() != null && isMilkProduct(cfg.getProduct()) && cfg.getDefaultQuantity() != null && cfg.getDefaultQuantity().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal price = cfg.getCustomPrice() != null ? cfg.getCustomPrice() : cfg.getProduct().getDefaultPrice();
                    subList.add(new com.liter.dto.CustomerSubscriptionDto(
                            cfg.getProduct().getId(),
                            cfg.getProduct().getName(),
                            cfg.getProduct().getUnit(),
                            cfg.getDefaultQuantity(),
                            price
                    ));
                }
            }

            dto.setSubscriptions(subList);

            if (!subList.isEmpty()) {
                com.liter.dto.CustomerSubscriptionDto primary = subList.get(0);
                dto.setProductId(primary.getProductId());
                dto.setProductName(primary.getProductName());
                dto.setProductUnit(primary.getProductUnit());
                dto.setQuantity(primary.getQuantity());
                dto.setRate(primary.getRate());
            }
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(@Valid @RequestBody Customer customer, Principal principal) {
        if (customer.getName() == null || customer.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Error: Customer name is required.");
        }

        User currentUser = getCurrentUser(principal);
        if (currentUser != null) {
            customer.setUser(currentUser);
            if (customerRepository.findByNameIgnoreCaseAndUser(customer.getName().trim(), currentUser).isPresent()) {
                return ResponseEntity.badRequest().body("Error: A customer with name '" + customer.getName().trim() + "' already exists in your list.");
            }
        } else {
            return ResponseEntity.status(401).body("Error: Authentication required to create customer.");
        }

        if (customer.getStartDate() == null) {
            customer.setStartDate(LocalDate.now(java.time.ZoneId.of("Asia/Kolkata")));
        }
        Customer saved = customerRepository.save(customer);

        // Auto-create default product config so customer appears immediately on delivery sheet
        try {
            Long prodId = customer.getProductId();
            Product product = null;
            if (prodId != null) {
                product = productRepository.findById(prodId).orElse(null);
            }
            if (product == null) {
                List<Product> activeProds = productRepository.findByActive(true);
                product = activeProds.stream()
                        .filter(this::isMilkProduct)
                        .findFirst()
                        .orElse(!activeProds.isEmpty() ? activeProds.get(0) : null);
            }

            if (product != null) {
                BigDecimal qty = customer.getQuantity() != null && customer.getQuantity().compareTo(BigDecimal.ZERO) > 0 
                        ? customer.getQuantity() : new BigDecimal("1.00");
                BigDecimal rate = customer.getRate() != null ? customer.getRate() : product.getDefaultPrice();

                CustomerProductConfig config = new CustomerProductConfig();
                config.setCustomer(saved);
                config.setProduct(product);
                config.setDefaultQuantity(qty);
                config.setCustomPrice(rate);
                config.setActive(true);
                customerProductConfigRepository.save(config);
            }
        } catch (Exception ex) {
            // Ignore if config creation notice
        }

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Long id, @Valid @RequestBody Customer customerDetails, Principal principal) {
        User currentUser = getCurrentUser(principal);
        return customerRepository.findById(id).map(customer -> {
            if (currentUser != null && customer.getUser() != null && !customer.getUser().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(403).body("Error: Access denied. Customer does not belong to you.");
            }

            // Enforce unique customer name check if name changed
            if (!customer.getName().equalsIgnoreCase(customerDetails.getName().trim())) {
                if (currentUser != null && customerRepository.findByNameIgnoreCaseAndUser(customerDetails.getName().trim(), currentUser).isPresent()) {
                    return ResponseEntity.badRequest().body("Error: Customer name '" + customerDetails.getName().trim() + "' is already taken.");
                }
            }

            customer.setName(customerDetails.getName().trim());
            customer.setMobileNumber(customerDetails.getMobileNumber());
            customer.setAddress(customerDetails.getAddress());
            customer.setStartDate(customerDetails.getStartDate());
            customer.setNotes(customerDetails.getNotes());
            // Status is intentionally not updated from this endpoint
            
            Customer updated = customerRepository.save(customer);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body, Principal principal) {
        User currentUser = getCurrentUser(principal);
        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equals("ACTIVE") && !newStatus.equals("INACTIVE"))) {
            return ResponseEntity.badRequest().build();
        }

        return customerRepository.findById(id).map(customer -> {
            if (currentUser != null && customer.getUser() != null && !customer.getUser().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(403).body("Access denied.");
            }
            customer.setStatus(newStatus);
            Customer updated = customerRepository.save(customer);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id, Principal principal) {
        User currentUser = getCurrentUser(principal);
        return customerRepository.findById(id).map(customer -> {
            if (currentUser != null && customer.getUser() != null && !customer.getUser().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(403).body("Error: Access denied. Customer does not belong to you.");
            }
            customerProductConfigRepository.deleteByCustomerId(id);
            customerPriceHistoryRepository.deleteByCustomerId(id);
            deliveryTransactionRepository.deleteByCustomerId(id);
            billItemRepository.deleteByBillCustomerId(id);
            billRepository.deleteByCustomerId(id);
            customerRepository.delete(customer);
            return ResponseEntity.ok().body(Map.of("message", "Customer deleted successfully from database."));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ------------------------------------------------------------------------
    // Customer Product Configuration & Specific Pricing (Transactional)
    // ------------------------------------------------------------------------

    @GetMapping("/{id}/configs")
    public ResponseEntity<List<CustomerConfigDto>> getCustomerConfigs(@PathVariable Long id, Principal principal) {
        User currentUser = getCurrentUser(principal);
        Customer customer = customerRepository.findById(id).orElse(null);
        if (customer == null) {
            return ResponseEntity.notFound().build();
        }
        if (currentUser != null && customer.getUser() != null && !customer.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).build();
        }

        List<CustomerProductConfig> configs = customerProductConfigRepository.findByCustomerId(id);
        List<Product> allActiveProducts = productRepository.findByActive(true);
        List<Product> milkProducts = allActiveProducts.stream()
                .filter(this::isMilkProduct)
                .collect(java.util.stream.Collectors.toList());
        if (milkProducts.isEmpty()) {
            milkProducts = allActiveProducts;
        }
        List<CustomerConfigDto> dtoList = new ArrayList<>();

        for (Product product : milkProducts) {
            CustomerProductConfig match = configs.stream()
                    .filter(c -> c.getProduct().getId().equals(product.getId()))
                    .findFirst()
                    .orElse(null);

            if (match != null) {
                dtoList.add(new CustomerConfigDto(
                        product.getId(),
                        match.getDefaultQuantity(),
                        match.getCustomPrice(),
                        match.isActive()
                ));
            } else {
                dtoList.add(new CustomerConfigDto(
                        product.getId(),
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
            @RequestBody CustomerConfigDto configDto,
            Principal principal) {

        User currentUser = getCurrentUser(principal);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));

        if (currentUser != null && customer.getUser() != null && !customer.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).build();
        }
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
        config.setDefaultQuantity(configDto.getDefaultQuantity());
        config.setCustomPrice(newPrice);
        config.setActive(configDto.isActive());

        CustomerProductConfig saved = customerProductConfigRepository.save(config);

        return ResponseEntity.ok(new CustomerConfigDto(
                product.getId(),
                saved.getDefaultQuantity(),
                saved.getCustomPrice(),
                saved.isActive()
        ));
    }
}
