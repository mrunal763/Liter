# 🥛 LITER — Dairy Business Management App

> **Made with ❤️ by Mrunal**

LITER is a modern, full-stack, 100% mobile-responsive Dairy Business Management Web Application designed for daily milk delivery operations, customer subscription tracking, product catalog pricing, automated monthly billing, and real-time business analytics.

---

## ✨ Features

### 📊 1. Upgraded Analytics Dashboard (`/reports`)
- **Multi-Tenant Security**: Strictly restricts statistics, charts, and tables to the currently authenticated user's customers and sales.
- **Flexible Filter Controls**: Presets for *Today*, *This Week*, *This Month*, *Last Month*, *Custom Date Range*, Product filter, and Customer filter.
- **Historical Month Switcher**: Jump directly to any previous month to view historical month-by-month sales performance.
- **Key Summary Cards**: Total Sales Revenue (₹), Volume Delivered, Customers Served, and Total Transactions.
- **Performance Highlights**: Highest-Selling Product, Highest-Value Customer, and Average Daily Sales (₹/day).
- **Interactive SVG Charts**:
  - **Product-Wise Sales Share**: Color-coded progress bar & legend cards with distinct colors for every product item and explicit price rates alongside milk types.
  - **Top Customer Purchases Bar Chart**: Visual comparison of top buyers.
  - **Day-Wise Sales Trend Line Chart**: Smooth SVG line & area curve tracking daily sales.
  - **6-Month Historical Sales Trend**: Month-by-month comparative bar chart.
- **Detailed Data Tables**: Tabbed views for Product Sales Details, Customer Sales Ledger, and Day-Wise Breakdown.

### 📱 2. Mobile App Responsiveness & PWA UX
- **Mobile Viewport & PWA Shell**: Integrated with `viewport-fit=cover`, custom mobile status bar styles, and touch optimization.
- **Sticky Bottom Navigation Bar**: 5 touch-optimized tabs (*Dashboard, Delivery, Customers, Billing, More*) with active pill indicators and tap feedback.
- **Slide-Out App Drawer**: Displays user profile avatar card (`@admin`), full section navigation links, and one-tap sign out.
- **Touch-Friendly Controls**: Touch targets minimum 44px height, horizontal touch scrolling for data tables, and overlay modal drawers.

### 🚚 3. Daily Delivery Operations (`/delivery`)
- **Single Daily Delivery Model**: Streamlined daily delivery sheet for morning and evening milk runs.
- **Bulk Actions**: One-click *Mark All Present*, *Mark All Absent*, and *Reset* status buttons.
- **Adjust Today's Delivery Modal**:
  - **Paneer**: Uses `kg` unit with weight presets (`0.25 kg`, `0.5 kg`, `0.75 kg`, `1 kg`, `1.5 kg`, `2 kg`, `2.5 kg`, `5 kg`).
  - **Curd**: Uses integer pack preset buttons (`1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`).
  - **Milk**: Uses liquid volume presets (`0.25 L`, `0.5 L`, `0.75 L`, `1 L`, `1.25 L`, `1.5 L`, `2 L`, `2.5 L`, `3 L`).
  - **Extra Product Demand**: One-day extra product selector with auto-adapting units.
- **Attendance History Calendar**: Modal displaying monthly customer attendance logs and total delivered days.

### 👥 4. Customer & Subscription Management (`/customers`)
- **Unique Name Enforcement**: Case-insensitive duplicate name checks to prevent accidental duplicate customer records.
- **Fractional Daily Quantities**: Support for `0.25`, `0.5`, `0.75`, `1.0`, `1.25`, `1.5`, `1.75`, `2.0`, `2.5`, `3.0` presets and `0.01` step precision.
- **Inline Editor & Configurator**: Set custom prices and daily subscriptions per product without disruptive popups.

### 📄 5. Automated Billing & PDF Invoices (`/billing`)
- **Automated Invoice Generation**: Generate period bills per customer or in bulk for all active customers.
- **Printable A4 PDF Invoices**: One-click A4 invoice preview, PDF download via `html2pdf.js`, and printing.

### 🔐 6. 30-Day Authentication Session
- Extended JWT session token expiration (30 days / 1 month) so dairy owners stay logged in seamlessly.

---

## 🛠️ Technology Stack

### **Backend**
- **Framework**: Java 21 / Spring Boot 3.3.2
- **Security**: Spring Security + JWT Authentication
- **ORM & Database**: Spring Data JPA + PostgreSQL
- **Build Tool**: Apache Maven 3.9
- **Schema Migration**: Custom `DatabaseSchemaMigrator` component for automated PostgreSQL DDL schema migrations.

### **Frontend**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Custom Vanilla CSS Design System with CSS Variables, Flexbox/Grid, & Touch Optimizations
- **Icons**: Lucide React
- **PDF Export**: `html2pdf.js`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+) & **npm**
- **Java Development Kit (JDK 21+)**
- **PostgreSQL Database** running on port `5432` with database `liter` (default credentials: `postgres`/`763`)

---

### 1. Backend Setup

```bash
cd backend
mvn spring-boot:run
```

The Spring Boot backend will start at: `http://localhost:8080`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server will start at: `http://localhost:5173`

---

## ☁️ Deployment Guide

### Option 1: Render + Vercel (Free Cloud Deployment)
1. **Database**: Create PostgreSQL instance on [Render.com](https://render.com).
2. **Backend**: Deploy `/backend` as a Web Service on Render with environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`).
3. **Frontend**: Deploy `/frontend` on [Vercel.com](https://vercel.com) with `VITE_API_BASE_URL` pointing to backend API.

### Option 2: VPS Server (Nginx + PostgreSQL + Docker)
Deploy on VPS (AWS, Hostinger, DigitalOcean) using `docker-compose`:
```bash
docker-compose up -d --build
```

### Option 3: Local Wi-Fi Network (Dairy Office PC)
1. Run backend on PC (`http://localhost:8080`).
2. Run frontend with host flag: `npm run dev -- --host`.
3. Open `http://<PC-IP-Address>:5173` on smartphones connected to the local Wi-Fi.

---

## 📄 License & Attribution

Designed and developed for **LITER Dairy Business Management**  
**Made with ❤️ by Mrunal**
