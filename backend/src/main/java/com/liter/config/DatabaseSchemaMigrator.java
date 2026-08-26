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
            logger.info("Migrating database schema for products table...");
            jdbcTemplate.execute("ALTER TABLE products ALTER COLUMN unit TYPE VARCHAR(50);");
            jdbcTemplate.execute("ALTER TABLE products DROP COLUMN IF EXISTS description;");
            
            // Drop any lingering unique constraint on products(name)
            try {
                jdbcTemplate.execute("DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT constraint_name FROM information_schema.constraint_column_usage WHERE table_name = 'products' AND column_name = 'name') LOOP EXECUTE 'ALTER TABLE products DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name); END LOOP; END $$;");
            } catch (Exception ex) {
                logger.warn("Could not drop unique constraint on products name: {}", ex.getMessage());
            }

            logger.info("Successfully migrated products table schema (unit column updated, description column removed, unique constraints dropped).");
        } catch (Exception e) {
            logger.warn("Database schema migration notice: {}", e.getMessage());
        }
    }
}
