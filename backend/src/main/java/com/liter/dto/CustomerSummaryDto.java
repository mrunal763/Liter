package com.liter.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Customer list item enriched with primary subscription summary.
 */
public class CustomerSummaryDto {

    private Long id;
    private String name;
    private String mobileNumber;
    private String address;
    private LocalDate startDate;
    private String notes;
    private LocalDateTime createdAt;

    // Primary subscription info (for single-item backwards compatibility)
    private Long productId;
    private String productName;
    private String productUnit;
    private BigDecimal quantity;
    private BigDecimal rate;

    // Full list of active subscriptions for this customer
    private java.util.List<CustomerSubscriptionDto> subscriptions = new java.util.ArrayList<>();

    public CustomerSummaryDto() {}

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductUnit() { return productUnit; }
    public void setProductUnit(String productUnit) { this.productUnit = productUnit; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }

    public java.util.List<CustomerSubscriptionDto> getSubscriptions() { return subscriptions; }
    public void setSubscriptions(java.util.List<CustomerSubscriptionDto> subscriptions) { this.subscriptions = subscriptions; }
}
