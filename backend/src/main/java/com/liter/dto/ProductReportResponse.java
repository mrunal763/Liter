package com.liter.dto;

import java.math.BigDecimal;

public class ProductReportResponse {
    private String productName;
    private BigDecimal quantitySold;
    private String unit;
    private BigDecimal revenue;

    public ProductReportResponse() {
    }

    public ProductReportResponse(String productName, BigDecimal quantitySold, String unit, BigDecimal revenue) {
        this.productName = productName;
        this.quantitySold = quantitySold;
        this.unit = unit;
        this.revenue = revenue;
    }

    // Getters and Setters
    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public BigDecimal getQuantitySold() {
        return quantitySold;
    }

    public void setQuantitySold(BigDecimal quantitySold) {
        this.quantitySold = quantitySold;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }
}
