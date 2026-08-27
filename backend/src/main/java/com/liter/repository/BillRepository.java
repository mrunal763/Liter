package com.liter.repository;

import com.liter.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByCustomerId(Long customerId);
    Optional<Bill> findByCustomerIdAndBillPeriodStartAndBillPeriodEnd(Long customerId, LocalDate startDate, LocalDate endDate);
    List<Bill> findByCustomerUserId(Long userId);
    List<Bill> findByCustomerUserIdAndBillPeriodStartGreaterThanEqualAndBillPeriodEndLessThanEqual(Long userId, LocalDate start, LocalDate end);
    Optional<Bill> findByIdAndCustomerUserId(Long id, Long userId);
    List<Bill> findByCustomerIdAndStatusNotOrderByBillPeriodStartAsc(Long customerId, String status);

    @Modifying
    @Transactional
    @Query("DELETE FROM Bill b WHERE b.customer.id = :customerId")
    void deleteByCustomerId(@Param("customerId") Long customerId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Bill b WHERE b.customer.user.id = :userId")
    void deleteByCustomerUserId(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Bill b WHERE b.id = :id AND b.customer.user.id = :userId")
    int deleteByIdAndCustomerUserId(@Param("id") Long id, @Param("userId") Long userId);
}
