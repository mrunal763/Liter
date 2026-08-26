package com.liter.repository;

import com.liter.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByCustomerId(Long customerId);
    List<Bill> findByCustomerIdAndStatusNot(Long customerId, String status);
    List<Bill> findByCustomerIdAndStatusNotOrderByBillPeriodStartAsc(Long customerId, String status);
    List<Bill> findByBillPeriodStartGreaterThanEqualAndBillPeriodEndLessThanEqual(LocalDate start, LocalDate end);
}
