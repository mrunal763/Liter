package com.liter.controller;

import com.liter.model.Product;
import com.liter.model.User;
import com.liter.repository.ProductRepository;
import com.liter.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.security.Principal;
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
            Optional<User> uOpt = userRepository.findByUsername(principal.getName());
            if (uOpt.isPresent()) {
                return uOpt.get();
            }
        }
        // Fallback to first user in database
        List<User> users = userRepository.findAll();
        if (!users.isEmpty()) {
            return users.get(0);
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(@RequestParam(required = false) Boolean active, Principal principal) {
        User currentUser = resolveCurrentUser(principal);
        if (currentUser != null) {
            if (active != null) {
                return ResponseEntity.ok(productRepository.findByUserAndActive(currentUser, active));
            }
            return ResponseEntity.ok(productRepository.findByUser(currentUser));
        }
        if (active != null) {
            return ResponseEntity.ok(productRepository.findByActive(active));
        }
        return ResponseEntity.ok(productRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product, Principal principal) {
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        User currentUser = resolveCurrentUser(principal);
        if (currentUser != null) {
            product.setUser(currentUser);
        }

        Product saved = productRepository.save(product);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody Product productDetails, Principal principal) {
        User currentUser = resolveCurrentUser(principal);
        Optional<Product> pOpt = currentUser != null 
            ? productRepository.findByIdAndUser(id, currentUser)
            : productRepository.findById(id);

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
        Optional<Product> pOpt = currentUser != null 
            ? productRepository.findByIdAndUser(id, currentUser)
            : productRepository.findById(id);

        return pOpt.map(product -> {
            product.setActive(statusDetails.isActive());
            Product updated = productRepository.save(product);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id, Principal principal) {
        User currentUser = resolveCurrentUser(principal);
        Optional<Product> pOpt = currentUser != null 
            ? productRepository.findByIdAndUser(id, currentUser)
            : productRepository.findById(id);

        if (pOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

