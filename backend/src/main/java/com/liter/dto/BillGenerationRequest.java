package com.liter.dto;

import java.time.LocalDate;

public class BillGenerationRequest {
    private Long customerId; // Nullable, if null we can generate for all active customers
    private LocalDate startDate;
    private LocalDate endDate;

    public BillGenerationRequest() {
    }

    public BillGenerationRequest(Long customerId, LocalDate startDate, LocalDate endDate) {
        this.customerId = customerId;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    // Getters and Setters
    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
}
