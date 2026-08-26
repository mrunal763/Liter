package com.liter.dto;

import java.math.BigDecimal;

public class DashboardReportResponse {
    private BigDecimal todaySales;
    private double milkSold;
    private long customersServed;
    private BigDecimal outstandingAmount;

    public DashboardReportResponse() {
    }

    public DashboardReportResponse(BigDecimal todaySales, double milkSold, long customersServed, BigDecimal outstandingAmount) {
        this.todaySales = todaySales;
        this.milkSold = milkSold;
        this.customersServed = customersServed;
        this.outstandingAmount = outstandingAmount;
    }

    // Getters and Setters
    public BigDecimal getTodaySales() {
        return todaySales;
    }

    public void setTodaySales(BigDecimal todaySales) {
        this.todaySales = todaySales;
    }

    public double getMilkSold() {
        return milkSold;
    }

    public void setMilkSold(double milkSold) {
        this.milkSold = milkSold;
    }

    public long getCustomersServed() {
        return customersServed;
    }

    public void setCustomersServed(long customersServed) {
        this.customersServed = customersServed;
    }

    public BigDecimal getOutstandingAmount() {
        return outstandingAmount;
    }

    public void setOutstandingAmount(BigDecimal outstandingAmount) {
        this.outstandingAmount = outstandingAmount;
    }
}
