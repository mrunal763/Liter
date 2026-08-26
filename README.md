# 🥛 Sachi Dudh Ganga — Liter Dairy Management System

> **Made with ❤️ by Mrunal**

A modern, full-stack enterprise Dairy Management Web Application built for daily milk distribution, customer subscription management, product category pricing, delivery tracking, and automated billing.

---

## ✨ Features

- **🌅 Dynamic Time-Based Greetings**: Greets the dairy owner based on real-time hours (e.g., *"Good Evening, Mrunal 👋 Sachi Dudh Ganga"*).
- **🥛 User-Scoped Category Catalog**: 
  - Manage products by category (*Milk, Curd, Butter Milk, Paneer, Ghee*).
  - Custom pricing per category.
  - Flexible units including `pack (sher)`, `L`, `kg`, `ml`, and `g`.
  - Immediate database persistence without disruptive confirmation popups.
- **👥 Customer & Subscription Management**:
  - Numbered list view with click-to-view detail panels.
  - Mandatory unique customer names, phone numbers, single address field, start dates, rates, and default quantities.
  - Active / Inactive status tracking with saved activation and deactivation timestamps.
- **📅 Daily Delivery Operations**:
  - Morning & Evening delivery logging with custom quantity overrides.
- **💳 Automated Billing & Ledger**:
  - Automatic invoice generation, payment records, and customer balance ledgers.
- **🔐 Extended 1-Month Authentication**:
  - JWT authentication with 30-day session persistence so users stay logged in.

---

## 🛠️ Technology Stack

### **Backend**
- **Framework**: Java 21 / Spring Boot 3.3
- **Security**: Spring Security + JWT Authentication
- **ORM & Database**: Spring Data JPA + PostgreSQL
- **Build Tool**: Apache Maven 3.9
- **Schema Migration**: Custom `DatabaseSchemaMigrator` component for seamless PostgreSQL DDL migrations

### **Frontend**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Vanilla CSS Design System with CSS Variables & Glassmorphism Aesthetics
- **Icons**: Lucide React

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

## 🏗️ Building for Production

### Frontend Production Build

```bash
cd frontend
npm run build
```

This compiles TypeScript and outputs an optimized bundle to `frontend/dist`.

---

## 📄 License & Attribution

Designed and developed for **Sachi Dudh Ganga**  
**Made with ❤️ by Mrunal**
