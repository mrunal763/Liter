package com.liter.dto;

import java.math.BigDecimal;

public class CustomerSubscriptionDto {

    private Long productId;
    private String productName;
    private String productUnit;
    private BigDecimal quantity;
    private BigDecimal rate;

    public CustomerSubscriptionDto() {
    }

    public CustomerSubscriptionDto(Long productId, String productName, String productUnit, BigDecimal quantity, BigDecimal rate) {
        this.productId = productId;
        this.productName = productName;
        this.productUnit = productUnit;
        this.quantity = quantity;
        this.rate = rate;
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

    public String getProductUnit() {
        return productUnit;
    }

    public void setProductUnit(String productUnit) {
        this.productUnit = productUnit;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }
}
