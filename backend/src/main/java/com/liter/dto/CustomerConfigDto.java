package com.liter.dto;

import java.math.BigDecimal;

public class CustomerConfigDto {
    private Long productId;
    private BigDecimal defaultQtyMorning;
    private BigDecimal defaultQtyEvening;
    private BigDecimal customPrice; // Null represents no override
    private boolean active = true;

    public CustomerConfigDto() {
    }

    public CustomerConfigDto(Long productId, BigDecimal defaultQtyMorning, BigDecimal defaultQtyEvening, BigDecimal customPrice, boolean active) {
        this.productId = productId;
        this.defaultQtyMorning = defaultQtyMorning;
        this.defaultQtyEvening = defaultQtyEvening;
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
}
