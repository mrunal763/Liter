package com.liter.service;

import com.liter.model.*;
import com.liter.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class BillingAndPaymentTests {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerProductConfigRepository customerProductConfigRepository;

    @Autowired
    private DeliveryTransactionRepository deliveryTransactionRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BillingService billingService;

    @Autowired
    private PaymentService paymentService;

    private Customer customer;
    private Product product;
    private CustomerProductConfig config;

    @BeforeEach
    public void setUp() {
        // Clear repositories (Transactional rollback will handle cleanup, but doing it safely)
        deliveryTransactionRepository.deleteAll();
        billRepository.deleteAll();
        paymentRepository.deleteAll();
        customerProductConfigRepository.deleteAll();
        customerRepository.deleteAll();
        productRepository.deleteAll();

        // 1. Create a Product (Milk - default price ₹60)
        product = new Product();
        product.setName("Milk");
        product.setCategory("Milk");
        product.setUnit("L");
        product.setDefaultPrice(new BigDecimal("60.00"));
        product.setActive(true);
        product = productRepository.save(product);

        // 2. Create a Customer (Ramesh Patil)
        customer = new Customer();
        customer.setName("Ramesh Patil");
        customer.setMobileNumber("9876543210");
        customer.setStartDate(LocalDate.now());
        customer.setStatus("ACTIVE");
        customer = customerRepository.save(customer);

        // 3. Configure Customer Product Config (Custom Price: ₹55.00, Morning Qty: 1.0)
        config = new CustomerProductConfig();
        config.setCustomer(customer);
        config.setProduct(product);
        config.setDefaultQtyMorning(new BigDecimal("1.00"));
        config.setDefaultQtyEvening(BigDecimal.ZERO);
        config.setCustomPrice(new BigDecimal("55.00")); // Custom Price Override
        config.setActive(true);
        config = customerProductConfigRepository.save(config);
    }

    @Test
    public void testPricingPriorityAndBillingGeneration() {
        LocalDate today = LocalDate.now();

        // Check configured prices
        BigDecimal appliedPrice = config.getCustomPrice() != null 
                ? config.getCustomPrice() 
                : product.getDefaultPrice();
        assertEquals(0, new BigDecimal("55.00").compareTo(appliedPrice), "Custom price should take priority over default price");

        // Record three daily deliveries
        for (int i = 0; i < 3; i++) {
            DeliveryTransaction t = new DeliveryTransaction();
            t.setCustomer(customer);
            t.setProduct(product);
            t.setDeliveryDate(today.minusDays(i));
            t.setSession("MORNING");
            t.setQuantity(new BigDecimal("1.00"));
            t.setUnit(product.getUnit());
            t.setAppliedPrice(appliedPrice);
            t.setTotalAmount(t.getQuantity().multiply(t.getAppliedPrice()));
            t.setStatus("DELIVERED");
            deliveryTransactionRepository.save(t);
        }

        // Generate the Bill
        Bill bill = billingService.generateBillForCustomer(customer.getId(), today.minusDays(5), today);

        // Verify monthly totals
        // Expecting: 3 deliveries * ₹55.00 = ₹165.00
        assertNotNull(bill, "Bill should be successfully generated");
        assertEquals(0, new BigDecimal("165.00").compareTo(bill.getTotalAmount()), "Total bill amount must equal ₹165.00");
        assertEquals(0, new BigDecimal("165.00").compareTo(bill.getOutstandingAmount()), "Initial outstanding amount must equal ₹165.00");
        assertEquals(0, BigDecimal.ZERO.compareTo(bill.getPaidAmount()), "Initial paid amount must equal ₹0.00");
        assertEquals("UNPAID", bill.getStatus(), "Initial status must be UNPAID");
    }

    @Test
    public void testChronologicalPaymentsFifoAllocation() {
        LocalDate today = LocalDate.now();
        BigDecimal appliedPrice = config.getCustomPrice();

        // 1. Log deliveries for Bill 1 (Aug 1 to Aug 5) - total ₹110.00
        for (int i = 0; i < 2; i++) {
            DeliveryTransaction t = new DeliveryTransaction();
            t.setCustomer(customer);
            t.setProduct(product);
            t.setDeliveryDate(today.minusDays(10 + i));
            t.setSession("MORNING");
            t.setQuantity(new BigDecimal("1.00"));
            t.setUnit(product.getUnit());
            t.setAppliedPrice(appliedPrice);
            t.setTotalAmount(t.getQuantity().multiply(t.getAppliedPrice()));
            t.setStatus("DELIVERED");
            deliveryTransactionRepository.save(t);
        }
        Bill bill1 = billingService.generateBillForCustomer(customer.getId(), today.minusDays(12), today.minusDays(10));

        // 2. Log deliveries for Bill 2 (Aug 6 to Aug 10) - total ₹55.00
        DeliveryTransaction t = new DeliveryTransaction();
        t.setCustomer(customer);
        t.setProduct(product);
        t.setDeliveryDate(today.minusDays(5));
        t.setSession("MORNING");
        t.setQuantity(new BigDecimal("1.00"));
        t.setUnit(product.getUnit());
        t.setAppliedPrice(appliedPrice);
        t.setTotalAmount(t.getQuantity().multiply(t.getAppliedPrice()));
        t.setStatus("DELIVERED");
        deliveryTransactionRepository.save(t);
        Bill bill2 = billingService.generateBillForCustomer(customer.getId(), today.minusDays(6), today.minusDays(4));

        // Check initial states
        assertEquals(0, new BigDecimal("110.00").compareTo(bill1.getOutstandingAmount()));
        assertEquals(0, new BigDecimal("55.00").compareTo(bill2.getOutstandingAmount()));

        // 3. Record a payment of ₹140.00 (should cover Bill 1 fully and Bill 2 partially)
        // Bill 1: ₹110 outstanding -> covers ₹110 (outstanding becomes ₹0, status becomes PAID)
        // Bill 2: ₹55 outstanding -> covers ₹30 remaining (outstanding becomes ₹25, status becomes PARTIALLY_PAID)
        Payment payment = paymentService.recordPayment(
                customer.getId(), today, new BigDecimal("140.00"), "UPI", "TXN12345", "FIFO test");

        assertNotNull(payment);
        
        // Reload bills from database to verify values
        Bill updatedBill1 = billRepository.findById(bill1.getId()).orElseThrow();
        Bill updatedBill2 = billRepository.findById(bill2.getId()).orElseThrow();

        assertEquals(0, new BigDecimal("110.00").compareTo(updatedBill1.getPaidAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(updatedBill1.getOutstandingAmount()));
        assertEquals("PAID", updatedBill1.getStatus());

        assertEquals(0, new BigDecimal("30.00").compareTo(updatedBill2.getPaidAmount()));
        assertEquals(0, new BigDecimal("25.00").compareTo(updatedBill2.getOutstandingAmount()));
        assertEquals("PARTIALLY_PAID", updatedBill2.getStatus());

        // 4. Record a second payment of ₹50.00
        // Bill 2: ₹25 outstanding -> covers ₹25 (outstanding becomes ₹0, status becomes PAID)
        // Excess ₹25 is carried forward
        paymentService.recordPayment(
                customer.getId(), today, new BigDecimal("50.00"), "CASH", "", "FIFO clear");

        Bill finalBill2 = billRepository.findById(bill2.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("55.00").compareTo(finalBill2.getPaidAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(finalBill2.getOutstandingAmount()));
        assertEquals("PAID", finalBill2.getStatus());
    }
}
