package com.liter.controller;

import com.liter.model.Product;
import com.liter.model.User;
import com.liter.repository.ProductRepository;
import com.liter.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    private User resolveCurrentUser(Principal principal) {
        if (principal != null) {
            return userRepository.findByUsername(principal.getName()).orElse(null);
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(@RequestParam(required = false) Boolean active, Principal principal) {
        User currentUser = resolveCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        if (active != null) {
            return ResponseEntity.ok(productRepository.findByUserAndActive(currentUser, active));
        }
        return ResponseEntity.ok(productRepository.findByUser(currentUser));
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product, Principal principal) {
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        User currentUser = resolveCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        product.setUser(currentUser);
        Product saved = productRepository.save(product);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody Product productDetails, Principal principal) {
        User currentUser = resolveCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<Product> pOpt = productRepository.findByIdAndUser(id, currentUser);
        return pOpt.map(product -> {
            product.setName(productDetails.getName());
            product.setCategory(productDetails.getCategory());
            product.setUnit(productDetails.getUnit());
            product.setDefaultPrice(productDetails.getDefaultPrice());
            product.setActive(productDetails.isActive());
            
            Product updated = productRepository.save(product);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Product> toggleStatus(@PathVariable Long id, @RequestBody Product statusDetails, Principal principal) {
        User currentUser = resolveCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<Product> pOpt = productRepository.findByIdAndUser(id, currentUser);
        return pOpt.map(product -> {
            product.setActive(statusDetails.isActive());
            Product updated = productRepository.save(product);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id, Principal principal) {
        User currentUser = resolveCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<Product> pOpt = productRepository.findByIdAndUser(id, currentUser);
        if (pOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

