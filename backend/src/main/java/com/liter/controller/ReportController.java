package com.liter.controller;

import com.liter.dto.AnalyticsReportResponse;
import com.liter.dto.CustomerReportResponse;
import com.liter.dto.DashboardReportResponse;
import com.liter.dto.ProductReportResponse;
import com.liter.model.*;
import com.liter.repository.BillRepository;
import com.liter.repository.CustomerRepository;
import com.liter.repository.DeliveryTransactionRepository;
import com.liter.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.Principal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
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

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByUsername(principal.getName()).orElse(null);
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsReportResponse> getAnalytics(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long customerId,
            Principal principal) {

        User currentUser = getCurrentUser(principal);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        LocalDate startDate = (start != null && !start.trim().isEmpty()) 
                ? LocalDate.parse(start.trim()) 
                : LocalDate.now().withDayOfMonth(1);
        LocalDate endDate = (end != null && !end.trim().isEmpty()) 
                ? LocalDate.parse(end.trim()) 
                : LocalDate.now();

        // Strict multi-tenant query: get transactions for current user's customers only
        List<DeliveryTransaction> transactions = deliveryTransactionRepository
                .findByCustomerUserIdAndDeliveryDateBetweenAndStatus(
                        currentUser.getId(), startDate, endDate, "DELIVERED"
                );

        if (productId != null) {
            transactions = transactions.stream()
                    .filter(t -> t.getProduct() != null && t.getProduct().getId().equals(productId))
                    .collect(Collectors.toList());
        }
        if (customerId != null) {
            transactions = transactions.stream()
                    .filter(t -> t.getCustomer() != null && t.getCustomer().getId().equals(customerId))
                    .collect(Collectors.toList());
        }

        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal totalQuantitySold = BigDecimal.ZERO;
        Set<Long> customerIdsServed = new HashSet<>();
        long totalTransactions = transactions.size();

        Map<Long, ProductHelper> productMap = new LinkedHashMap<>();
        Map<Long, CustomerHelper> customerMap = new LinkedHashMap<>();
        Map<LocalDate, DayHelper> dayMap = new TreeMap<>();

        // Populate day timeline
        LocalDate cur = startDate;
        while (!cur.isAfter(endDate)) {
            dayMap.put(cur, new DayHelper(cur.toString()));
            cur = cur.plusDays(1);
        }

        for (DeliveryTransaction t : transactions) {
            BigDecimal qty = t.getQuantity() != null ? t.getQuantity() : BigDecimal.ZERO;
            BigDecimal amt = t.getTotalAmount() != null ? t.getTotalAmount() : BigDecimal.ZERO;

            totalSales = totalSales.add(amt);
            totalQuantitySold = totalQuantitySold.add(qty);

            if (t.getCustomer() != null) {
                customerIdsServed.add(t.getCustomer().getId());
            }

            if (t.getProduct() != null) {
                Product p = t.getProduct();
                ProductHelper ph = productMap.computeIfAbsent(p.getId(), 
                        k -> new ProductHelper(p.getId(), p.getName(), p.getCategory(), p.getUnit()));
                ph.quantitySold = ph.quantitySold.add(qty);
                ph.totalRevenue = ph.totalRevenue.add(amt);
            }

            if (t.getCustomer() != null) {
                Customer c = t.getCustomer();
                CustomerHelper ch = customerMap.computeIfAbsent(c.getId(), 
                        k -> new CustomerHelper(c.getId(), c.getName(), c.getMobileNumber()));
                ch.totalQuantity = ch.totalQuantity.add(qty);
                ch.totalAmount = ch.totalAmount.add(amt);
                ch.transactionCount++;
            }

            if (t.getDeliveryDate() != null && dayMap.containsKey(t.getDeliveryDate())) {
                DayHelper dh = dayMap.get(t.getDeliveryDate());
                dh.salesAmount = dh.salesAmount.add(amt);
                dh.quantitySold = dh.quantitySold.add(qty);
                dh.transactionCount++;
            }
        }

        long daysCount = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (daysCount < 1) daysCount = 1;
        BigDecimal avgDailySales = totalSales.divide(BigDecimal.valueOf(daysCount), 2, RoundingMode.HALF_UP);

        // Build product summaries
        List<AnalyticsReportResponse.ProductSummary> productSummaries = new ArrayList<>();
        String highestSellingProduct = "N/A";
        BigDecimal maxProdRev = BigDecimal.ZERO;

        for (ProductHelper ph : productMap.values()) {
            double pct = (totalSales.compareTo(BigDecimal.ZERO) > 0)
                    ? ph.totalRevenue.multiply(BigDecimal.valueOf(100)).divide(totalSales, 2, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            BigDecimal avgPrice = (ph.quantitySold.compareTo(BigDecimal.ZERO) > 0)
                    ? ph.totalRevenue.divide(ph.quantitySold, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            productSummaries.add(new AnalyticsReportResponse.ProductSummary(
                    ph.id, ph.name, ph.category, ph.unit, ph.quantitySold, avgPrice, ph.totalRevenue, pct
            ));

            if (ph.totalRevenue.compareTo(maxProdRev) > 0) {
                maxProdRev = ph.totalRevenue;
                highestSellingProduct = ph.name + " (" + ph.quantitySold + " " + ph.unit + ")";
            }
        }
        productSummaries.sort((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()));

        // Build customer summaries
        List<AnalyticsReportResponse.CustomerSummary> customerSummaries = new ArrayList<>();
        String highestValueCustomer = "N/A";
        BigDecimal maxCustAmt = BigDecimal.ZERO;

        for (CustomerHelper ch : customerMap.values()) {
            customerSummaries.add(new AnalyticsReportResponse.CustomerSummary(
                    ch.id, ch.name, ch.mobile, ch.totalQuantity, ch.totalAmount, ch.transactionCount
            ));

            if (ch.totalAmount.compareTo(maxCustAmt) > 0) {
                maxCustAmt = ch.totalAmount;
                highestValueCustomer = ch.name + " (₹" + ch.totalAmount.setScale(2, RoundingMode.HALF_UP) + ")";
            }
        }
        customerSummaries.sort((a, b) -> b.getTotalAmount().compareTo(a.getTotalAmount()));

        // Build day trends
        List<AnalyticsReportResponse.DayTrend> dayTrends = new ArrayList<>();
        for (DayHelper dh : dayMap.values()) {
            dayTrends.add(new AnalyticsReportResponse.DayTrend(dh.date, dh.salesAmount, dh.quantitySold, dh.transactionCount));
        }

        // Build 6-Month Historical Trend
        List<AnalyticsReportResponse.MonthTrend> monthlyTrends = new ArrayList<>();
        LocalDate nowMonth = LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            LocalDate mStart = nowMonth.minusMonths(i).withDayOfMonth(1);
            LocalDate mEnd = mStart.withDayOfMonth(mStart.lengthOfMonth());
            String mKey = mStart.toString().substring(0, 7);
            String mName = mStart.format(DateTimeFormatter.ofPattern("MMM yyyy"));

            List<DeliveryTransaction> mTrans = deliveryTransactionRepository
                    .findByCustomerUserIdAndDeliveryDateBetweenAndStatus(
                            currentUser.getId(), mStart, mEnd, "DELIVERED"
                    );

            BigDecimal mSales = mTrans.stream()
                    .map(t -> t.getTotalAmount() != null ? t.getTotalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal mQty = mTrans.stream()
                    .map(t -> t.getQuantity() != null ? t.getQuantity() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            monthlyTrends.add(new AnalyticsReportResponse.MonthTrend(mKey, mName, mSales, mQty));
        }

        AnalyticsReportResponse response = new AnalyticsReportResponse(
                totalSales,
                totalQuantitySold,
                customerIdsServed.size(),
                totalTransactions,
                avgDailySales,
                highestSellingProduct,
                highestValueCustomer,
                productSummaries,
                customerSummaries,
                dayTrends,
                monthlyTrends
        );

        return ResponseEntity.ok(response);
    }

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
                
                if (!servedCustomerIds.contains(t.getCustomer().getId())) {
                    servedCustomerIds.add(t.getCustomer().getId());
                }

                String prodName = t.getProduct().getName().toLowerCase();
                String prodCat = t.getProduct().getCategory().toLowerCase();
                if (prodName.contains("milk") || prodCat.contains("milk")) {
                    milkSold += t.getQuantity().doubleValue();
                }
            }
        }

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
    public ResponseEntity<List<CustomerReportResponse>> getCustomerReport(Principal principal) {
        User currentUser = getCurrentUser(principal);
        List<Customer> customers = currentUser != null 
                ? customerRepository.findByUser(currentUser) 
                : new ArrayList<>();
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

    // Helper classes for aggregation
    private static class ProductHelper {
        Long id;
        String name;
        String category;
        String unit;
        BigDecimal quantitySold = BigDecimal.ZERO;
        BigDecimal totalRevenue = BigDecimal.ZERO;

        ProductHelper(Long id, String name, String category, String unit) {
            this.id = id;
            this.name = name;
            this.category = category;
            this.unit = unit;
        }
    }

    private static class CustomerHelper {
        Long id;
        String name;
        String mobile;
        BigDecimal totalQuantity = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;
        int transactionCount = 0;

        CustomerHelper(Long id, String name, String mobile) {
            this.id = id;
            this.name = name;
            this.mobile = mobile;
        }
    }

    private static class DayHelper {
        String date;
        BigDecimal salesAmount = BigDecimal.ZERO;
        BigDecimal quantitySold = BigDecimal.ZERO;
        int transactionCount = 0;

        DayHelper(String date) {
            this.date = date;
        }
    }
}
