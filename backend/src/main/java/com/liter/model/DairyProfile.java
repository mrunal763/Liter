package com.liter.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dairy_profiles")
public class DairyProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "business_name", nullable = false, length = 100)
    private String businessName = "Sachi Dudh Ganga";

    @Column(name = "owner_name", nullable = false, length = 100)
    private String ownerName = "Mrunal";

    @Column(name = "mobile_number", length = 15)
    private String mobileNumber;

    @Column(length = 255)
    private String address;

    @Column(name = "upi_id", length = 100)
    private String upiId;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public DairyProfile() {
    }

    public DairyProfile(Long id, String businessName, String ownerName, String mobileNumber, String address, String upiId, LocalDateTime updatedAt) {
        this.id = id;
        this.businessName = businessName;
        this.ownerName = ownerName;
        this.mobileNumber = mobileNumber;
        this.address = address;
        this.upiId = upiId;
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

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
