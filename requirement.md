# Requirements Document — LITER

> **Status key:** each requirement below is marked **✅ Implemented** (verifiable in the current codebase), **🟡 Partial** (implemented with documented deviations), or **📋 Planned** (not built; see §14).

## 1. Product Overview

**LITER** is a multi-tenant dairy business management web application. Each registered account represents one dairy owner who delivers milk and dairy products to customers on a daily route.

* **Target user**: A dairy owner / operator (role `ROLE_OWNER`). Registration is open; every account is an isolated tenant.
* **No customer portal**: Customers of the dairy do not use this application, do not have accounts, and cannot log in.
* **No employee management**: The application is operated solely by the owner account. ✅ Implemented
* **Live deployment**: Frontend at [liter-nine.vercel.app](https://liter-nine.vercel.app/); backend API deployed separately (Docker image).

> **Deviation from original brief**: the product evolved from a strictly single-tenant tool into a multi-tenant application (any number of owner accounts, strict per-owner data isolation). All data queries are resolved against the authenticated principal.

---

## 2. Branding & Identity

* **Product name**: LITER ✅ Implemented
* **Business name**: Configured by the owner in Settings and displayed on invoices and the dashboard header. ✅ Implemented (`DairyProfile.businessName`)

---

## 3. Product Catalog

Generic catalog with no hardcoded product logic. ✅ Implemented

* **Properties**: Name (required, unique per owner, case-insensitive), Category, Unit (`L`, `ml`, `kg`, `g`, `piece`), Default Price (required, non-negative), Active flag.
* **Deviations from brief**:
  * Product `description` field is **not persisted** (planned). 🟡
  * Uniqueness is scoped **per owner** (`user_id`), not global.
* **Lifecycle**: Inactive products cannot be selected for new customer configurations; historical delivery transactions are never modified. ✅ Implemented
* **Deletion**: Products can be **hard-deleted** together with their dependent rows (configs, price history, transactions, bill items) via JDBC cleanup. This intentionally exceeds the brief's "soft-deactivate only" stance. 🟡 (documented deviation)

---

## 4. Customer Management

* **Fields**: Name (required), Mobile number, Address, Start date, Status (`ACTIVE` / `INACTIVE`), Notes, system timestamps. ✅ Implemented
* **Not built** (planned): `village` and `landmark` fields. 📋
* **Uniqueness**: Case-insensitive customer name per owner, enforced at the repository level and validated in the API. ✅ Implemented
* **Lifecycle**: Status can be toggled `ACTIVE` / `INACTIVE` via `PATCH /{id}/status`. Inactive customers are excluded from new delivery sheets; all history is preserved. ✅ Implemented
* **Deletion**: Customers can be **hard-deleted**; the API cascades deletion of configs, price history, transactions, and bills in one transaction. 🟡 (deviation from "soft-delete only")
* **On create**: a default `CustomerProductConfig` is created from the form's quantity/rate, falling back to the owner's milk-like product. ✅ Implemented

---

## 5. Customer-Specific Pricing & Defaults

* **Pricing hierarchy** (highest wins): 1. price entered on the day's sheet row → 2. `CustomerProductConfig.customPrice` → 3. `Product.defaultPrice`. ✅ Implemented
* **Snapshotting**: the applied price is written onto the delivery transaction at save time; later price changes never rewrite historical rows. ✅ Implemented
* **Price history**: changing a custom price closes the previous open `CustomerPriceHistory` interval (ends yesterday) and opens a new one starting today. ✅ Implemented
* **Default subscription**: each customer maps products to default quantities and prices via `CustomerProductConfig` (unique per customer+product, with an `active` flag). ✅ Implemented
* **Deviation**: the brief's separate **Morning** and **Evening** default quantities are consolidated into a single `default_quantity`; delivery operates a single `DAILY` session. 🟡 (see §6)

---

## 6. Daily Delivery / Sales System

The core operational module. ✅ Implemented

* **Sessions**: the brief specified Morning/Evening; the running system uses a single **`DAILY`** session (schema retains a `session` column; migrator consolidates legacy morning/evening quantities into `default_quantity`). 🟡
* **Delivery sheet** (`GET /api/deliveries/sheet?date=…`):
  * Pre-fills customers whose effective start date is on or before the chosen date (effective start = earlier of `startDate` and `createdAt`). ✅
  * Rows carry default quantity vs actual quantity, unit, applied price, status, and notes. ✅
  * Per-row quantity/price edits do **not** mutate the customer's default configuration. ✅
  * Bulk actions: **Mark all present** / **Mark all absent**. ✅
  * Extra product lines can be added per customer for that day. ✅
* **Statuses**: `DELIVERED` (quantity recorded, total computed server-side as `quantity × appliedPrice`) and `SKIPPED` (quantity 0, no charges). The sheet uses `UNMARKED` client-side before save. ✅
* **Persistence**: `POST /api/deliveries/bulk` performs an upsert per row (unique key: customer + product + date + session). Rows dated before a customer's effective start are rejected. ✅
* **Attendance calendar**: monthly per-customer history (present/absent days, daily volume) via `GET /api/deliveries/customer-history/{customerId}`. ✅

---

## 7. Billing Engine

* **Generation**: manual, by the owner, for an inclusive start/end date range — for one customer or all of the owner's customers. ✅ Implemented
* **Calculation**:

  $$\text{Bill Total} = \sum (\text{delivered\_quantity} \times \text{snapshotted\_applied\_price})$$

  computed from `DELIVERED` transactions in the range (never from subscription defaults). ✅ Implemented
* **Bill properties**: customer reference, period start/end, issue date, total amount, paid amount (starts 0.00), outstanding amount, status (`UNPAID` / `PARTIALLY_PAID` / `PAID`). ✅ Implemented
* **Regeneration**: generating a bill for the same customer and exact period replaces its line items and resets paid/outstanding to 0 / `UNPAID`. ✅ Implemented
* **Invoice output**: per-product summary line items (`bill_items` with quantity, average price, amount), day-wise delivery listing, browser print, and A4 PDF via `html2pdf.js`. ✅ Implemented

---

## 8. Payments

* **Methods**: free-form strings; tests exercise `UPI` and `CASH`. (The entity comment documents `CASH`, `UPI`, `BANK_TRANSFER`, `OTHER`; no DB-level CHECK constraint.) 🟡
* **Fields**: customer, date, amount (required, strictly positive — validated), method, reference number, notes. ✅ Implemented
* **FIFO allocation**: a recorded payment pays down the customer's oldest unpaid/partially-paid bills in `bill_period_start` order, updating `paid_amount`, `outstanding_amount`, and status. ✅ Implemented
* **Deviation**: excess amount beyond all outstanding bills is **not** stored as customer credit. 📋 (roadmap)
* **UI**: allocation logic exists on the API and in tests only; no payments page in the React app yet. 📋

---

## 9. Reports

* **Dashboard** (`GET /api/reports/dashboard`): today's sales (₹), milk volume sold today (name/category contains "milk"), customers served today, sum of bill outstanding amounts. ✅ Implemented
* **Analytics** (`GET /api/reports/analytics`): date-range product share, top customers, day-by-day trend, 6-month trend, with optional product/customer filters. ✅ Implemented
* **Customer ledger** (`GET /api/reports/customers`): billed / paid / outstanding totals per customer. ✅ Implemented
* **Deviation**: session-wise revenue reporting is not applicable under the `DAILY` session model. 🟡

---

## 10. UI/UX & Styling

* **Mobile-first responsive layout**: bottom navigation + slide-out drawer under 768px; sidebar above. ✅ Implemented
* **Color palette**: green/white identity (primary `#2E7D32`, dark `#1B5E20`, light surfaces `#E8F5E9`/`#F5FBF5`, text `#1F2937`/`#6B7280`, error `#D32F2F`). ✅ Implemented
* **Input optimization**: large tap targets, product-aware quantity preset chips (e.g. milk ±litres, paneer ±kg) minimizing keyboard use. ✅ Implemented
* **Print/PDF styles** for invoices. ✅ Implemented

---

## 11. Core Business & Data Integrity Rules

1. Quantities and prices cannot be negative. ✅ (validated/computed server-side)
2. Payment amounts must be strictly positive. ✅
3. Every delivery stores its applied price snapshot at save time. ✅
4. Unauthenticated users are redirected to the login page (`ProtectedRoute` client-side; Spring Security server-side). ✅
5. Deactivating a customer preserves all historical records. ✅ (hard delete also exists, explicitly)
6. Old bills and transactions never change when current prices are modified. ✅

---

## 12. Authentication & Tenancy

* Registration creates a `User` (`ROLE_OWNER`) plus a `DairyProfile`; login issues a JWT (HS256, configurable TTL, default 30 days). ✅
* All operational data is scoped to the authenticated owner at the query level. ✅
* Known open items (tracked in README "Security notes"): two report endpoints and the payments list are not yet principal-scoped; CORS is fully permissive; password reset is UI-simulated only. 🟡

---

## 13. Out of Scope (Confirmed)

* Milk production / livestock yield tracking
* Inventory and conversion (milk → curd/paneer/ghee)
* Expense tracking
* Profitability reporting (revenue − expenses)

---

## 14. Planned (From Brief, Not Yet Built)

| Item | Origin |
| --- | --- |
| Customer `village` / `landmark` fields; product `description` | §4, §3 |
| Morning/Evening sessions as the operating model | §5, §6 |
| Payments page in the UI | §8 |
| Customer credit for excess payments | §8 |
| Password reset flow (server-backed) | — |
| Soft-delete-only lifecycle for customers/products | §3, §4 |
