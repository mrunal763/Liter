package com.liter.repository;

import com.liter.model.BillItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface BillItemRepository extends JpaRepository<BillItem, Long> {
    List<BillItem> findByBillId(Long billId);

    @Modifying
    @Transactional
    @Query("DELETE FROM BillItem bi WHERE bi.bill.id = :billId")
    void deleteByBillId(@Param("billId") Long billId);

    @Modifying
    @Transactional
    @Query("DELETE FROM BillItem bi WHERE bi.bill.customer.id = :customerId")
    void deleteByBillCustomerId(@Param("customerId") Long customerId);

    @Modifying
    @Transactional
    @Query("DELETE FROM BillItem bi WHERE bi.bill.customer.user.id = :userId")
    void deleteByBillCustomerUserId(@Param("userId") Long userId);
}
