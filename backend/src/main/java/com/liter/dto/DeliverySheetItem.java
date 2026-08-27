package com.liter.dto;

import java.math.BigDecimal;

public class DeliverySheetItem {
    private Long customerId;
    private String customerName;
    private Long productId;
    private String productName;
    private BigDecimal defaultQuantity;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal appliedPrice;
    private String status;
    private String notes;

    private boolean isOverride;
    private String overrideDiff;
    private boolean isExtraProduct;
    private String customerStartDate;

    public DeliverySheetItem() {
    }

    public DeliverySheetItem(Long customerId, String customerName, Long productId, String productName, BigDecimal defaultQuantity, BigDecimal quantity, String unit, BigDecimal appliedPrice, String status, String notes) {
        this.customerId = customerId;
        this.customerName = customerName;
        this.productId = productId;
        this.productName = productName;
        this.defaultQuantity = defaultQuantity;
        this.quantity = quantity;
        this.unit = unit;
        this.appliedPrice = appliedPrice;
        this.status = status;
        this.notes = notes;
        this.computeOverrideMetrics();
    }

    public void computeOverrideMetrics() {
        if (defaultQuantity == null) defaultQuantity = BigDecimal.ZERO;
        if (quantity == null) quantity = BigDecimal.ZERO;

        this.isExtraProduct = (defaultQuantity.compareTo(BigDecimal.ZERO) == 0);
        if ("DELIVERED".equalsIgnoreCase(status) && quantity.compareTo(defaultQuantity) != 0) {
            this.isOverride = true;
            BigDecimal diff = quantity.subtract(defaultQuantity);
            if (diff.compareTo(BigDecimal.ZERO) > 0) {
                this.overrideDiff = "+" + diff.toPlainString() + " " + (unit != null ? unit : "");
            } else {
                this.overrideDiff = diff.toPlainString() + " " + (unit != null ? unit : "");
            }
        } else {
            this.isOverride = false;
            this.overrideDiff = null;
        }
    }

    // Getters and Setters
    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public BigDecimal getDefaultQuantity() {
        return defaultQuantity;
    }

    public void setDefaultQuantity(BigDecimal defaultQuantity) {
        this.defaultQuantity = defaultQuantity;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getAppliedPrice() {
        return appliedPrice;
    }

    public void setAppliedPrice(BigDecimal appliedPrice) {
        this.appliedPrice = appliedPrice;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public boolean isOverride() {
        return isOverride;
    }

    public void setOverride(boolean override) {
        isOverride = override;
    }

    public String getOverrideDiff() {
        return overrideDiff;
    }

    public void setOverrideDiff(String overrideDiff) {
        this.overrideDiff = overrideDiff;
    }

    public boolean isExtraProduct() {
        return isExtraProduct;
    }

    public void setExtraProduct(boolean extraProduct) {
        isExtraProduct = extraProduct;
    }

    public String getCustomerStartDate() {
        return customerStartDate;
    }

    public void setCustomerStartDate(String customerStartDate) {
        this.customerStartDate = customerStartDate;
    }
}
