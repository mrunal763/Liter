package com.liter.repository;

import com.liter.model.DeliveryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DeliveryTransactionRepository extends JpaRepository<DeliveryTransaction, Long> {
    List<DeliveryTransaction> findByDeliveryDateAndSession(LocalDate deliveryDate, String session);
    List<DeliveryTransaction> findByCustomerIdAndDeliveryDateBetweenAndStatus(Long customerId, LocalDate start, LocalDate end, String status);
    List<DeliveryTransaction> findByCustomerUserIdAndDeliveryDateBetweenAndStatus(Long userId, LocalDate start, LocalDate end, String status);
    List<DeliveryTransaction> findByCustomerIdAndDeliveryDateBetween(Long customerId, LocalDate start, LocalDate end);
    List<DeliveryTransaction> findByCustomerIdAndDeliveryDate(Long customerId, LocalDate deliveryDate);
    Optional<DeliveryTransaction> findByCustomerIdAndProductIdAndDeliveryDateAndSession(Long customerId, Long productId, LocalDate deliveryDate, String session);
    Optional<DeliveryTransaction> findByCustomerIdAndProductIdAndDeliveryDate(Long customerId, Long productId, LocalDate deliveryDate);
    List<DeliveryTransaction> findByDeliveryDate(LocalDate date);
    void deleteByCustomerId(Long customerId);
}
