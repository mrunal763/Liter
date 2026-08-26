package com.liter.controller;

import com.liter.dto.CustomerReportResponse;
import com.liter.dto.DashboardReportResponse;
import com.liter.dto.ProductReportResponse;
import com.liter.model.*;
import com.liter.repository.BillRepository;
import com.liter.repository.CustomerRepository;
import com.liter.repository.DeliveryTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private DeliveryTransactionRepository deliveryTransactionRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardReportResponse> getDashboardReport() {
        LocalDate today = LocalDate.now();
        List<DeliveryTransaction> todayTransactions = deliveryTransactionRepository
                .findByDeliveryDate(today);

        BigDecimal todaySales = BigDecimal.ZERO;
        double milkSold = 0.0;
        
        List<Long> servedCustomerIds = new ArrayList<>();

        for (DeliveryTransaction t : todayTransactions) {
            if ("DELIVERED".equals(t.getStatus())) {
                todaySales = todaySales.add(t.getTotalAmount());
                
                // Track distinct customers served
                if (!servedCustomerIds.contains(t.getCustomer().getId())) {
                    servedCustomerIds.add(t.getCustomer().getId());
                }

                // Track milk volume sold (match name or category case insensitively)
                String prodName = t.getProduct().getName().toLowerCase();
                String prodCat = t.getProduct().getCategory().toLowerCase();
                if (prodName.contains("milk") || prodCat.contains("milk")) {
                    milkSold += t.getQuantity().doubleValue();
                }
            }
        }

        // Sum up total outstanding amount of all bills
        List<Bill> allBills = billRepository.findAll();
        BigDecimal outstandingAmount = BigDecimal.ZERO;
        for (Bill b : allBills) {
            outstandingAmount = outstandingAmount.add(b.getOutstandingAmount());
        }

        DashboardReportResponse response = new DashboardReportResponse(
                todaySales,
                milkSold,
                servedCustomerIds.size(),
                outstandingAmount
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/products")
    public ResponseEntity<List<ProductReportResponse>> getProductReport(
            @RequestParam String start,
            @RequestParam String end) {

        LocalDate startDate = LocalDate.parse(start);
        LocalDate endDate = LocalDate.parse(end);

        List<DeliveryTransaction> transactions = new ArrayList<>();
        // Query transactions in range
        List<DeliveryTransaction> allTransactions = deliveryTransactionRepository.findAll();
        for (DeliveryTransaction t : allTransactions) {
            LocalDate d = t.getDeliveryDate();
            if ((d.isEqual(startDate) || d.isAfter(startDate)) && 
                (d.isEqual(endDate) || d.isBefore(endDate)) && 
                "DELIVERED".equals(t.getStatus())) {
                transactions.add(t);
            }
        }

        Map<Product, List<DeliveryTransaction>> group = transactions.stream()
                .collect(Collectors.groupingBy(DeliveryTransaction::getProduct));

        List<ProductReportResponse> list = new ArrayList<>();
        for (Map.Entry<Product, List<DeliveryTransaction>> entry : group.entrySet()) {
            Product product = entry.getKey();
            List<DeliveryTransaction> listItems = entry.getValue();

            BigDecimal qty = BigDecimal.ZERO;
            BigDecimal rev = BigDecimal.ZERO;

            for (DeliveryTransaction t : listItems) {
                qty = qty.add(t.getQuantity());
                rev = rev.add(t.getTotalAmount());
            }

            list.add(new ProductReportResponse(
                    product.getName(),
                    qty,
                    product.getUnit(),
                    rev
            ));
        }

        return ResponseEntity.ok(list);
    }

    @GetMapping("/customers")
    public ResponseEntity<List<CustomerReportResponse>> getCustomerReport() {
        List<Customer> customers = customerRepository.findAll();
        List<CustomerReportResponse> report = new ArrayList<>();

        for (Customer customer : customers) {
            List<Bill> bills = billRepository.findByCustomerId(customer.getId());
            BigDecimal billed = BigDecimal.ZERO;
            BigDecimal paid = BigDecimal.ZERO;
            BigDecimal outstanding = BigDecimal.ZERO;

            for (Bill b : bills) {
                billed = billed.add(b.getTotalAmount());
                paid = paid.add(b.getPaidAmount());
                outstanding = outstanding.add(b.getOutstandingAmount());
            }

            report.add(new CustomerReportResponse(
                    customer.getName(),
                    billed,
                    paid,
                    outstanding
            ));
        }

        return ResponseEntity.ok(report);
    }
}
