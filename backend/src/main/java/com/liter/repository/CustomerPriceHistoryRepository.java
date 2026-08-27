package com.liter.repository;

import com.liter.model.CustomerPriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerPriceHistoryRepository extends JpaRepository<CustomerPriceHistory, Long> {
    Optional<CustomerPriceHistory> findFirstByCustomerIdAndProductIdAndEndDateIsNull(Long customerId, Long productId);
    List<CustomerPriceHistory> findByCustomerIdAndProductIdOrderByStartDateDesc(Long customerId, Long productId);
    void deleteByCustomerId(Long customerId);
}
