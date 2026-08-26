package com.liter.dto;

import java.math.BigDecimal;

public class CustomerReportResponse {
    private String customerName;
    private BigDecimal totalBilled;
    private BigDecimal totalPaid;
    private BigDecimal outstanding;

    public CustomerReportResponse() {
    }

    public CustomerReportResponse(String customerName, BigDecimal totalBilled, BigDecimal totalPaid, BigDecimal outstanding) {
        this.customerName = customerName;
        this.totalBilled = totalBilled;
        this.totalPaid = totalPaid;
        this.outstanding = outstanding;
    }

    // Getters and Setters
    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public BigDecimal getTotalBilled() {
        return totalBilled;
    }

    public void setTotalBilled(BigDecimal totalBilled) {
        this.totalBilled = totalBilled;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getOutstanding() {
        return outstanding;
    }

    public void setOutstanding(BigDecimal outstanding) {
        this.outstanding = outstanding;
    }
}
