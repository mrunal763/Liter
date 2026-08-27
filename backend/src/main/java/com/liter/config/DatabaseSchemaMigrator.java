package com.liter.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSchemaMigrator {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSchemaMigrator.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void migrateSchema() {
        try {
            logger.info("Migrating database schema...");

            // ── Column type fixes ──────────────────────────────────────────────
            jdbcTemplate.execute("ALTER TABLE products ALTER COLUMN unit TYPE VARCHAR(50);");
            jdbcTemplate.execute("ALTER TABLE delivery_transactions ALTER COLUMN unit TYPE VARCHAR(50);");

            // ── Drop legacy columns ────────────────────────────────────────────
            jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS dairy_type;");
            jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS livestock;");
            jdbcTemplate.execute("ALTER TABLE dairy_profiles DROP COLUMN IF EXISTS dairy_type;");
            jdbcTemplate.execute("ALTER TABLE dairy_profiles DROP COLUMN IF EXISTS livestock;");

            // ── Make phone/address optional in customers ───────────────────────
            // Phone number and address are no longer required fields
            jdbcTemplate.execute("ALTER TABLE customers ALTER COLUMN mobile_number DROP NOT NULL;");
            jdbcTemplate.execute("ALTER TABLE customers ALTER COLUMN address DROP NOT NULL;");

            // ── Purge test data ────────────────────────────────────────────────
            jdbcTemplate.execute("DELETE FROM customer_product_configs WHERE customer_id IN (SELECT id FROM customers WHERE LOWER(name) LIKE '%prisha%');");
            jdbcTemplate.execute("DELETE FROM customer_price_history WHERE customer_id IN (SELECT id FROM customers WHERE LOWER(name) LIKE '%prisha%');");
            jdbcTemplate.execute("DELETE FROM delivery_transactions WHERE customer_id IN (SELECT id FROM customers WHERE LOWER(name) LIKE '%prisha%');");
            jdbcTemplate.execute("DELETE FROM bill_items WHERE bill_id IN (SELECT id FROM bills WHERE customer_id IN (SELECT id FROM customers WHERE LOWER(name) LIKE '%prisha%'));");
            jdbcTemplate.execute("DELETE FROM bills WHERE customer_id IN (SELECT id FROM customers WHERE LOWER(name) LIKE '%prisha%');");
            jdbcTemplate.execute("DELETE FROM customers WHERE LOWER(name) LIKE '%prisha%';");

            // ── customer_product_configs column migration ──────────────────────
            jdbcTemplate.execute("ALTER TABLE customer_product_configs ADD COLUMN IF NOT EXISTS default_quantity NUMERIC(10,2) DEFAULT 0.00;");
            jdbcTemplate.execute("UPDATE customer_product_configs SET default_quantity = COALESCE(default_qty_morning, 0) + COALESCE(default_qty_evening, 0) WHERE default_quantity = 0 OR default_quantity IS NULL;");
            jdbcTemplate.execute("UPDATE customer_product_configs SET default_quantity = 1.00 WHERE default_quantity = 0 OR default_quantity IS NULL;");

            // ── Ownership backfill ─────────────────────────────────────────────
            jdbcTemplate.execute("UPDATE customers SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1) WHERE user_id IS NULL;");

            // ── Delivery normalisation ─────────────────────────────────────────
            jdbcTemplate.execute("DELETE FROM delivery_transactions dt1 USING delivery_transactions dt2 WHERE dt1.id < dt2.id AND dt1.customer_id = dt2.customer_id AND dt1.product_id = dt2.product_id AND dt1.delivery_date = dt2.delivery_date;");
            jdbcTemplate.execute("UPDATE delivery_transactions SET session = 'DAILY' WHERE session IS NULL OR session != 'DAILY';");

            logger.info("Database schema migration complete.");
        } catch (Exception e) {
            logger.warn("Schema migration notice (may be safe to ignore): {}", e.getMessage());
        }
    }
}
