package com.liter.repository;

import com.liter.model.DeliveryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DeliveryTransactionRepository extends JpaRepository<DeliveryTransaction, Long> {
    List<DeliveryTransaction> findByDeliveryDateAndSession(LocalDate deliveryDate, String session);
    List<DeliveryTransaction> findByCustomerIdAndDeliveryDateBetweenAndStatus(Long customerId, LocalDate start, LocalDate end, String status);
    Optional<DeliveryTransaction> findByCustomerIdAndProductIdAndDeliveryDateAndSession(Long customerId, Long productId, LocalDate deliveryDate, String session);
    List<DeliveryTransaction> findByDeliveryDate(LocalDate date);
}
