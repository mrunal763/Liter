package com.liter.dto;

import java.math.BigDecimal;

public class CustomerConfigDto {
    private Long productId;
    private BigDecimal defaultQuantity;
    private BigDecimal customPrice; // Null represents no override
    private boolean active = true;

    public CustomerConfigDto() {
    }

    public CustomerConfigDto(Long productId, BigDecimal defaultQuantity, BigDecimal customPrice, boolean active) {
        this.productId = productId;
        this.defaultQuantity = defaultQuantity;
        this.customPrice = customPrice;
        this.active = active;
    }

    // Getters and Setters
    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public BigDecimal getDefaultQuantity() {
        return defaultQuantity;
    }

    public void setDefaultQuantity(BigDecimal defaultQuantity) {
        this.defaultQuantity = defaultQuantity;
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
}
