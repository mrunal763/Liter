package com.liter.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "customer_product_configs",
    uniqueConstraints = @UniqueConstraint(columnNames = {"customer_id", "product_id"})
)
public class CustomerProductConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "default_qty_morning", nullable = false, precision = 6, scale = 2)
    private BigDecimal defaultQtyMorning = BigDecimal.ZERO;

    @Column(name = "default_qty_evening", nullable = false, precision = 6, scale = 2)
    private BigDecimal defaultQtyEvening = BigDecimal.ZERO;

    @Column(name = "custom_price", precision = 10, scale = 2)
    private BigDecimal customPrice; // Null represents using default product price

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public CustomerProductConfig() {
    }

    public CustomerProductConfig(Long id, Customer customer, Product product, BigDecimal defaultQtyMorning, BigDecimal defaultQtyEvening, BigDecimal customPrice, boolean active, LocalDateTime updatedAt) {
        this.id = id;
        this.customer = customer;
        this.product = product;
        this.defaultQtyMorning = defaultQtyMorning;
        this.defaultQtyEvening = defaultQtyEvening;
        this.customPrice = customPrice;
        this.active = active;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public BigDecimal getDefaultQtyMorning() {
        return defaultQtyMorning;
    }

    public void setDefaultQtyMorning(BigDecimal defaultQtyMorning) {
        this.defaultQtyMorning = defaultQtyMorning;
    }

    public BigDecimal getDefaultQtyEvening() {
        return defaultQtyEvening;
    }

    public void setDefaultQtyEvening(BigDecimal defaultQtyEvening) {
        this.defaultQtyEvening = defaultQtyEvening;
    }

    public BigDecimal getCustomPrice() {
        return customPrice;
    }

    public void setCustomPrice(BigDecimal customPrice) {
        this.customPrice = customPrice;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
