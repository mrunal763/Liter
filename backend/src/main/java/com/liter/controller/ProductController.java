package com.liter.controller;

import com.liter.model.Product;
import com.liter.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(@RequestParam(required = false) Boolean active) {
        if (active != null) {
            return ResponseEntity.ok(productRepository.findByActive(active));
        }
        return ResponseEntity.ok(productRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        // Enforce validations
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Product saved = productRepository.save(product);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody Product productDetails) {
        return productRepository.findById(id).map(product -> {
            product.setName(productDetails.getName());
            product.setCategory(productDetails.getCategory());
            product.setUnit(productDetails.getUnit());
            product.setDefaultPrice(productDetails.getDefaultPrice());
            product.setDescription(productDetails.getDescription());
            product.setActive(productDetails.isActive());
            
            Product updated = productRepository.save(product);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Product> toggleStatus(@PathVariable Long id, @RequestBody Product statusDetails) {
        return productRepository.findById(id).map(product -> {
            product.setActive(statusDetails.isActive());
            Product updated = productRepository.save(product);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }
}
