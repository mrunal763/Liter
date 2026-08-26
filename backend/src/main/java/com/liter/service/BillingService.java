package com.liter.service;

import com.liter.model.Bill;
import com.liter.model.BillItem;
import com.liter.model.Customer;
import com.liter.model.DeliveryTransaction;
import com.liter.model.Product;
import com.liter.repository.BillItemRepository;
import com.liter.repository.BillRepository;
import com.liter.repository.CustomerRepository;
import com.liter.repository.DeliveryTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BillingService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private DeliveryTransactionRepository deliveryTransactionRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private BillItemRepository billItemRepository;

    @Transactional
    public Bill generateBillForCustomer(Long customerId, LocalDate startDate, LocalDate endDate) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));

        // 1. Load all delivered transactions for the date range
        List<DeliveryTransaction> deliveries = deliveryTransactionRepository
                .findByCustomerIdAndDeliveryDateBetweenAndStatus(customerId, startDate, endDate, "DELIVERED");

        if (deliveries.isEmpty()) {
            throw new IllegalStateException("No delivered transactions found for the period: " + startDate + " to " + endDate);
        }

        // 2. Sum up total bill amount
        BigDecimal totalBillAmount = BigDecimal.ZERO;
        for (DeliveryTransaction d : deliveries) {
            totalBillAmount = totalBillAmount.add(d.getTotalAmount());
        }

        // 3. Create and save the Bill header
        Bill bill = new Bill();
        bill.setCustomer(customer);
        bill.setBillPeriodStart(startDate);
        bill.setBillPeriodEnd(endDate);
        bill.setIssueDate(LocalDate.now());
        bill.setTotalAmount(totalBillAmount);
        bill.setPaidAmount(BigDecimal.ZERO);
        bill.setOutstandingAmount(totalBillAmount);
        bill.setStatus("UNPAID");

        Bill savedBill = billRepository.save(bill);

        // 4. Compile line-item breakdown by product
        Map<Product, List<DeliveryTransaction>> deliveriesByProduct = deliveries.stream()
                .collect(Collectors.groupingBy(DeliveryTransaction::getProduct));

        List<BillItem> billItems = new ArrayList<>();
        for (Map.Entry<Product, List<DeliveryTransaction>> entry : deliveriesByProduct.entrySet()) {
            Product product = entry.getKey();
            List<DeliveryTransaction> productDeliveries = entry.getValue();

            BigDecimal totalQuantity = BigDecimal.ZERO;
            BigDecimal totalProductAmount = BigDecimal.ZERO;

            for (DeliveryTransaction d : productDeliveries) {
                totalQuantity = totalQuantity.add(d.getQuantity());
                totalProductAmount = totalProductAmount.add(d.getTotalAmount());
            }

            BigDecimal averagePrice = BigDecimal.ZERO;
            if (totalQuantity.compareTo(BigDecimal.ZERO) > 0) {
                averagePrice = totalProductAmount.divide(totalQuantity, 2, RoundingMode.HALF_UP);
            }

            BillItem item = new BillItem();
            item.setBill(savedBill);
            item.setProduct(product);
            item.setTotalQuantity(totalQuantity);
            item.setAveragePrice(averagePrice);
            item.setTotalAmount(totalProductAmount);

            billItems.add(item);
        }

        billItemRepository.saveAll(billItems);

        return savedBill;
    }
}
