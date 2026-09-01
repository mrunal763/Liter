package com.liter.dto;

import java.math.BigDecimal;
import java.util.List;

public class AnalyticsReportResponse {
    private BigDecimal totalSales = BigDecimal.ZERO;
    private BigDecimal totalQuantitySold = BigDecimal.ZERO;
    private int totalCustomersServed = 0;
    private long totalTransactions = 0;
    private BigDecimal avgDailySales = BigDecimal.ZERO;
    private String highestSellingProduct = "N/A";
    private String highestValueCustomer = "N/A";

    private List<ProductSummary> productSales;
    private List<CustomerSummary> customerSales;
    private List<DayTrend> dayWiseTrend;
    private List<MonthTrend> monthlyTrend;

    public AnalyticsReportResponse() {
    }

    public AnalyticsReportResponse(BigDecimal totalSales, BigDecimal totalQuantitySold, int totalCustomersServed, long totalTransactions, BigDecimal avgDailySales, String highestSellingProduct, String highestValueCustomer, List<ProductSummary> productSales, List<CustomerSummary> customerSales, List<DayTrend> dayWiseTrend, List<MonthTrend> monthlyTrend) {
        this.totalSales = totalSales;
        this.totalQuantitySold = totalQuantitySold;
        this.totalCustomersServed = totalCustomersServed;
        this.totalTransactions = totalTransactions;
        this.avgDailySales = avgDailySales;
        this.highestSellingProduct = highestSellingProduct;
        this.highestValueCustomer = highestValueCustomer;
        this.productSales = productSales;
        this.customerSales = customerSales;
        this.dayWiseTrend = dayWiseTrend;
        this.monthlyTrend = monthlyTrend;
    }

    public BigDecimal getTotalSales() {
        return totalSales;
    }

    public void setTotalSales(BigDecimal totalSales) {
        this.totalSales = totalSales;
    }

    public BigDecimal getTotalQuantitySold() {
        return totalQuantitySold;
    }

    public void setTotalQuantitySold(BigDecimal totalQuantitySold) {
        this.totalQuantitySold = totalQuantitySold;
    }

    public int getTotalCustomersServed() {
        return totalCustomersServed;
    }

    public void setTotalCustomersServed(int totalCustomersServed) {
        this.totalCustomersServed = totalCustomersServed;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public BigDecimal getAvgDailySales() {
        return avgDailySales;
    }

    public void setAvgDailySales(BigDecimal avgDailySales) {
        this.avgDailySales = avgDailySales;
    }

    public String getHighestSellingProduct() {
        return highestSellingProduct;
    }

    public void setHighestSellingProduct(String highestSellingProduct) {
        this.highestSellingProduct = highestSellingProduct;
    }

    public String getHighestValueCustomer() {
        return highestValueCustomer;
    }

    public void setHighestValueCustomer(String highestValueCustomer) {
        this.highestValueCustomer = highestValueCustomer;
    }

    public List<ProductSummary> getProductSales() {
        return productSales;
    }

    public void setProductSales(List<ProductSummary> productSales) {
        this.productSales = productSales;
    }

    public List<CustomerSummary> getCustomerSales() {
        return customerSales;
    }

    public void setCustomerSales(List<CustomerSummary> customerSales) {
        this.customerSales = customerSales;
    }

    public List<DayTrend> getDayWiseTrend() {
        return dayWiseTrend;
    }

    public void setDayWiseTrend(List<DayTrend> dayWiseTrend) {
        this.dayWiseTrend = dayWiseTrend;
    }

    public List<MonthTrend> getMonthlyTrend() {
        return monthlyTrend;
    }

    public void setMonthlyTrend(List<MonthTrend> monthlyTrend) {
        this.monthlyTrend = monthlyTrend;
    }

    public static class ProductSummary {
        private Long id;
        private String productName;
        private String category;
        private String unit;
        private BigDecimal quantitySold = BigDecimal.ZERO;
        private BigDecimal averagePrice = BigDecimal.ZERO;
        private BigDecimal totalRevenue = BigDecimal.ZERO;
        private double percentage = 0.0;

        public ProductSummary() {
        }

        public ProductSummary(Long id, String productName, String category, String unit, BigDecimal quantitySold, BigDecimal averagePrice, BigDecimal totalRevenue, double percentage) {
            this.id = id;
            this.productName = productName;
            this.category = category;
            this.unit = unit;
            this.quantitySold = quantitySold;
            this.averagePrice = averagePrice;
            this.totalRevenue = totalRevenue;
            this.percentage = percentage;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getProductName() {
            return productName;
        }

        public void setProductName(String productName) {
            this.productName = productName;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public BigDecimal getQuantitySold() {
            return quantitySold;
        }

        public void setQuantitySold(BigDecimal quantitySold) {
            this.quantitySold = quantitySold;
        }

        public BigDecimal getAveragePrice() {
            return averagePrice;
        }

        public void setAveragePrice(BigDecimal averagePrice) {
            this.averagePrice = averagePrice;
        }

        public BigDecimal getTotalRevenue() {
            return totalRevenue;
        }

        public void setTotalRevenue(BigDecimal totalRevenue) {
            this.totalRevenue = totalRevenue;
        }

        public double getPercentage() {
            return percentage;
        }

        public void setPercentage(double percentage) {
            this.percentage = percentage;
        }
    }

    public static class CustomerSummary {
        private Long id;
        private String customerName;
        private String mobileNumber;
        private BigDecimal totalQuantity = BigDecimal.ZERO;
        private BigDecimal totalAmount = BigDecimal.ZERO;
        private int transactionCount = 0;

        public CustomerSummary() {
        }

        public CustomerSummary(Long id, String customerName, String mobileNumber, BigDecimal totalQuantity, BigDecimal totalAmount, int transactionCount) {
            this.id = id;
            this.customerName = customerName;
            this.mobileNumber = mobileNumber;
            this.totalQuantity = totalQuantity;
            this.totalAmount = totalAmount;
            this.transactionCount = transactionCount;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getCustomerName() {
            return customerName;
        }

        public void setCustomerName(String customerName) {
            this.customerName = customerName;
        }

        public String getMobileNumber() {
            return mobileNumber;
        }

        public void setMobileNumber(String mobileNumber) {
            this.mobileNumber = mobileNumber;
        }

        public BigDecimal getTotalQuantity() {
            return totalQuantity;
        }

        public void setTotalQuantity(BigDecimal totalQuantity) {
            this.totalQuantity = totalQuantity;
        }

        public BigDecimal getTotalAmount() {
            return totalAmount;
        }

        public void setTotalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
        }

        public int getTransactionCount() {
            return transactionCount;
        }

        public void setTransactionCount(int transactionCount) {
            this.transactionCount = transactionCount;
        }
    }

    public static class DayTrend {
        private String date;
        private BigDecimal salesAmount = BigDecimal.ZERO;
        private BigDecimal quantitySold = BigDecimal.ZERO;
        private int transactionCount = 0;

        public DayTrend() {
        }

        public DayTrend(String date, BigDecimal salesAmount, BigDecimal quantitySold, int transactionCount) {
            this.date = date;
            this.salesAmount = salesAmount;
            this.quantitySold = quantitySold;
            this.transactionCount = transactionCount;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public BigDecimal getSalesAmount() {
            return salesAmount;
        }

        public void setSalesAmount(BigDecimal salesAmount) {
            this.salesAmount = salesAmount;
        }

        public BigDecimal getQuantitySold() {
            return quantitySold;
        }

        public void setQuantitySold(BigDecimal quantitySold) {
            this.quantitySold = quantitySold;
        }

        public int getTransactionCount() {
            return transactionCount;
        }

        public void setTransactionCount(int transactionCount) {
            this.transactionCount = transactionCount;
        }
    }

    public static class MonthTrend {
        private String monthKey;
        private String monthName;
        private BigDecimal salesAmount = BigDecimal.ZERO;
        private BigDecimal quantitySold = BigDecimal.ZERO;

        public MonthTrend() {
        }

        public MonthTrend(String monthKey, String monthName, BigDecimal salesAmount, BigDecimal quantitySold) {
            this.monthKey = monthKey;
            this.monthName = monthName;
            this.salesAmount = salesAmount;
            this.quantitySold = quantitySold;
        }

        public String getMonthKey() {
            return monthKey;
        }

        public void setMonthKey(String monthKey) {
            this.monthKey = monthKey;
        }

        public String getMonthName() {
            return monthName;
        }

        public void setMonthName(String monthName) {
            this.monthName = monthName;
        }

        public BigDecimal getSalesAmount() {
            return salesAmount;
        }

        public void setSalesAmount(BigDecimal salesAmount) {
            this.salesAmount = salesAmount;
        }

        public BigDecimal getQuantitySold() {
            return quantitySold;
        }

        public void setQuantitySold(BigDecimal quantitySold) {
            this.quantitySold = quantitySold;
        }
    }
}
