# Technical Implementation Plan — LITER

This document details the software architecture, database design, REST API specifications, frontend pages, security policies, and local development configurations.

---

## 1. Project Folder Structure
```
Liter/
├── backend/                         # Spring Boot Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/liter/
│   │   │   │   ├── controller/      # REST Endpoints
│   │   │   │   ├── model/           # JPA Entities
│   │   │   │   ├── repository/      # Spring Data JPA interfaces
│   │   │   │   ├── service/         # Business services (Billing, Pricing, FIFO logic)
│   │   │   │   ├── security/        # JWT Authentication and filters
│   │   │   │   └── dto/             # Requests/Responses DTOs
│   │   │   └── resources/
│   │   │       ├── application.yml  # Shared application settings
│   │   │       ├── application-dev.yml  # H2 local configuration (No Docker required)
│   │   │       └── application-prod.yml # PostgreSQL production configuration
│   │   └── test/                    # Backend unit & integration tests
│   ├── pom.xml                      # Maven Build Configuration
│   └── mvnw                         # Maven Wrapper for Linux/macOS
│   └── mvnw.cmd                     # Maven Wrapper for Windows
├── frontend/                        # React SPA (Vite + TS)
│   ├── src/
│   │   ├── assets/                  # CSS files, icons, logos
│   │   ├── components/              # Reusable UI widgets (QuantitySelector, BottomNav)
│   │   ├── context/                 # State providers (AuthContext, AppContext)
│   │   ├── hooks/                   # Custom Hooks
│   │   ├── pages/                   # Router page views
│   │   ├── services/                # API network request wrappers
│   │   ├── App.tsx                  # Main router definitions
│   │   └── main.tsx                 # Root entrypoint
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docker-compose.yml               # Optional PostgreSQL setup
├── requirement.md                   # Product requirements document
└── implementation.md                 # Technical architecture blueprint
```

---

## 2. Database Schema (PostgreSQL & H2 Compliant)

### Users Table
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ROLE_OWNER',
    full_name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Dairy Profile
```sql
CREATE TABLE dairy_profiles (
    id BIGSERIAL PRIMARY KEY,
    business_name VARCHAR(100) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(15),
    address VARCHAR(255),
    upi_id VARCHAR(100),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Customers
```sql
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(15),
    address VARCHAR(255),
    village VARCHAR(100),
    landmark VARCHAR(100),
    start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_customer_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
CREATE INDEX idx_customers_status ON customers(status);
```

### Products
```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    default_price NUMERIC(10, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_product_price CHECK (default_price >= 0),
    CONSTRAINT chk_product_unit CHECK (unit IN ('L', 'ml', 'kg', 'g', 'piece'))
);
```

### Customer Product Configuration
```sql
CREATE TABLE customer_product_configs (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    default_qty_morning NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    default_qty_evening NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    custom_price NUMERIC(10, 2),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_customer_product UNIQUE (customer_id, product_id),
    CONSTRAINT chk_qty_morning CHECK (default_qty_morning >= 0),
    CONSTRAINT chk_qty_evening CHECK (default_qty_evening >= 0),
    CONSTRAINT chk_custom_price CHECK (custom_price >= 0)
);
```

### Customer Price History
```sql
CREATE TABLE customer_price_history (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    price NUMERIC(10, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_history_price CHECK (price >= 0),
    CONSTRAINT chk_history_dates CHECK (end_date IS NULL OR start_date <= end_date)
);
```

### Delivery Transactions
```sql
CREATE TABLE delivery_transactions (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    delivery_date DATE NOT NULL,
    session VARCHAR(10) NOT NULL, -- MORNING, EVENING
    quantity NUMERIC(6, 2) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    applied_price NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- DELIVERED, NOT_DELIVERED, SKIPPED
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_transaction_session CHECK (session IN ('MORNING', 'EVENING')),
    CONSTRAINT chk_transaction_status CHECK (status IN ('DELIVERED', 'NOT_DELIVERED', 'SKIPPED')),
    CONSTRAINT chk_transaction_qty CHECK (quantity >= 0),
    CONSTRAINT chk_transaction_price CHECK (applied_price >= 0),
    CONSTRAINT chk_transaction_amount CHECK (total_amount >= 0),
    CONSTRAINT unique_delivery_day UNIQUE (customer_id, product_id, delivery_date, session)
);
CREATE INDEX idx_deliveries_date_session ON delivery_transactions(delivery_date, session);
CREATE INDEX idx_deliveries_customer ON delivery_transactions(customer_id);
```

### Bills
```sql
CREATE TABLE bills (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    bill_period_start DATE NOT NULL,
    bill_period_end DATE NOT NULL,
    issue_date DATE NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    outstanding_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL, -- UNPAID, PARTIALLY_PAID, PAID
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_bill_status CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID')),
    CONSTRAINT chk_bill_dates CHECK (bill_period_start <= bill_period_end)
);
CREATE INDEX idx_bills_customer ON bills(customer_id);
```

### Bill Items
```sql
CREATE TABLE bill_items (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    total_quantity NUMERIC(10, 2) NOT NULL,
    average_price NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    CONSTRAINT chk_bill_item_qty CHECK (total_quantity >= 0),
    CONSTRAINT chk_bill_item_amount CHECK (total_amount >= 0)
);
```

### Payments
```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    payment_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL, -- CASH, UPI, BANK_TRANSFER, OTHER
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'))
);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

---

## 3. Core REST API Contract

| Endpoint | Method | Security | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public | `{username, password}` | Retrieves JWT token on valid credentials |
| `/api/auth/me` | `GET` | Protected | None | Returns verified details of current user |
| `/api/customers` | `GET` | Protected | None | Returns all customers (active/inactive filter) |
| `/api/customers` | `POST` | Protected | Customer details | Creates a new customer directory profile |
| `/api/customers/{id}` | `PUT` | Protected | Updated details | Updates fields of an existing customer |
| `/api/customers/{id}/configs`| `PUT` | Protected | Configuration | Sets default qty morning/evening & custom price |
| `/api/products` | `GET` | Protected | None | Lists available products |
| `/api/products` | `POST` | Protected | Product payload | Creates a generic product item |
| `/api/deliveries/sheet` | `GET` | Protected | Query: `date`, `session` | Generates active grid for that date/session |
| `/api/deliveries/bulk` | `POST` | Protected | List of delivery items | Stores/updates transactions in bulk |
| `/api/billing/generate` | `POST` | Protected | `{customerId, startDate, endDate}` | Computes and creates a manual bill |
| `/api/payments` | `POST` | Protected | Payment payload | Logs payment and applies FIFO paydowns |
| `/api/reports/dashboard`| `GET` | Protected | None | Computes daily statistics for dashboard |

---

## 4. Frontend State & Pages
The frontend uses standard **React Context** to manage local user states:
* **AuthContext**: Captures current JWT token and login state. Automatically attaches the token to the header of requests via a fetch wrapper.
* **AppContext**: Stores cached lookup items like the active product catalog.

### Page Routes
1. **`/login`**: Simplistic centered layout for logging in the user.
2. **`/` (Dashboard)**: Home layout showing today's sales, served count, outstanding totals, and immediate quick-links.
3. **`/delivery`**: Session selector toggle (Morning/Evening) + Interactive scrolling sheet of customers. Large touch-friendly selection buttons.
4. **`/customers`**: List card collection with status badges, phone numbers, and a slide-over configuration page for custom default amounts and prices.
5. **`/billing`**: Date pickers, lists of outstanding totals, and a sharing popup to draft a text overview of the bill ready to be sent to WhatsApp.
6. **`/payments`**: Payment registration popup form and ledger history logs.
7. **`/reports`**: Tabular and simple bar breakdowns of monthly transactions.
8. **`/settings`**: Input forms for business details (Shree Krishna Dairy), profile updates, and the logout link.

---

## 5. Billing Engine & Payment Allocation (FIFO)
* **Billing Formula**:
  $$\text{Bill Total} = \sum (\text{delivery\_transactions.quantity} \times \text{delivery\_transactions.applied\_price})$$
* **FIFO Logic**:
  * When a payment $P$ is registered:
    1. Fetch all unpaid/partially paid bills for the customer sorted by `bill_period_start ASC`.
    2. Loop through bills. For each bill $B$:
       - Calculate remaining outstanding amount: $O = B.\text{total\_amount} - B.\text{paid\_amount}$.
       - If $P \ge O$:
         - Update $B.\text{paid\_amount} = B.\text{total\_amount}$, $B.\text{outstanding\_amount} = 0$, $B.\text{status} = \text{'PAID'}$.
         - Subtract $O$ from $P$ ($P = P - O$).
       - If $0 < P < O$:
         - Update $B.\text{paid\_amount} = B.\text{paid\_amount} + P$, $B.\text{outstanding\_amount} = O - P$, $B.\text{status} = \text{'PARTIALLY\_PAID'}$.
         - Set $P = 0$.
         - Break loop.
    3. If $P > 0$ after loop, record it as a credit/excess payment (carried forward to next generated bill).

---

## 6. Local Running Configuration

### Running with H2 (Recommended for zero-install setup)
Since Docker downloads can experience network timeouts, the Spring Boot application includes a `dev` profile that runs against an in-memory **H2 database** in PostgreSQL compatibility mode. Database tables are generated automatically upon launch.

1. **Start Backend**:
   Navigate to the `/backend` folder:
   ```cmd
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
   ```
2. **Start Frontend**:
   Navigate to the `/frontend` folder:
   ```cmd
   npm install
   npm run dev
   ```

### Running with PostgreSQL (Docker Compose)
1. **Start Postgres container**:
   In the root directory, run:
   ```cmd
   & "C:\Users\soman\AppData\Local\Programs\DockerDesktop\resources\bin\docker-compose.exe" up -d
   ```
2. **Start Backend in prod profile**:
   Navigate to the `/backend` folder:
   ```cmd
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
   ```
