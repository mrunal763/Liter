package com.liter.repository;

import com.liter.model.CustomerProductConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerProductConfigRepository extends JpaRepository<CustomerProductConfig, Long> {
    List<CustomerProductConfig> findByCustomerIdAndActive(Long customerId, boolean active);
    List<CustomerProductConfig> findByCustomerId(Long customerId);
    Optional<CustomerProductConfig> findByCustomerIdAndProductId(Long customerId, Long productId);
}
