# EstateFlow — Enterprise Real Estate SaaS Platform

![EstateFlow Architecture](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi)
![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

EstateFlow is a production-grade enterprise Real Estate SaaS platform built with FastAPI (Python) and React 19 + Vite + TailwindCSS. It features a complete end-to-end booking workflow, automated multi-tier revenue sharing engine, partner wallet ledgers, role-based access control (RBAC), and interactive financial tools.

---

## 🌟 Flagship Features

### 1. Automated Booking-to-Revenue Distribution Workflow (USP)
- **Automatic Commission Calculation**: Upon updating a booking status to `Confirmed`, `Approved`, or `Completed`, EstateFlow automatically evaluates active revenue rules, applies 5% TDS withholding (Section 194H), credits partner wallets, generates immutable wallet transactions, creates monthly settlement items, and dispatches in-app notifications.
- **Visual Commission Flow Stepper**: Step-by-step pipeline tracking property booking → payment → rule match → wallet credit → settlement.

### 2. Multi-Role Portal Navigation (RBAC)
Customized user interface based on logged-in role:
- **Super Admin / Admin**: Full access to all 12 platform modules.
- **Sales Manager**: Dashboard, Property Management, CRM, Bookings, Site Visits, Revenue, Analytics.
- **Sales Executive**: Dashboard, Property Management, CRM, Bookings, Site Visits, Notifications.
- **Customer Support**: Dashboard, CRM, Bookings, Reviews, Notifications, Settings.
- **Customer / Buyer**: Wishlist, Bookings, Visits, Investments, Mortgage EMI Calculator, Property Comparison.

### 3. Financial & Customer Calculators
- **Mortgage EMI Calculator**: Interactive sliders for loan amount, tenure, interest rate, and repayment schedules.
- **Property Side-by-Side Comparison**: Evaluate 2+ properties on BHK, carpet area, price/sqft, RERA, and amenity matrices.
- **Broker Leaderboard**: Rank channel partners by earnings and deals closed.

### 4. File Management & Reports
- **Drag-and-Drop Dropzone Uploader**: File previews, size validation, PDF & image support.
- **CSV & Report Exporting**: One-click exports for monthly settlements, commission ledgers, and TDS withholding summaries.

---

## 🚀 Quick Start (Local Development)

### 1. Backend Server (FastAPI)
```powershell
# Create & activate virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run server
python -m uvicorn server.main:app --host 127.0.0.1 --port 8000
```
API Documentation available at: [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)

### 2. Frontend Development Server (Vite + React 19)
```powershell
cd client
npm install
npm run dev
```
Frontend accessible at: [http://localhost:5173](http://localhost:5173)

---

## 🐳 Docker Production Deployment

Run the entire platform inside a container with single-command orchestration:

```bash
# Build & start container
docker-compose up --build -d

# Check logs
docker-compose logs -f
```

---

## 🧪 Production Verification Suite

Run automated sanity tests against FastAPI routers, database models, RBAC JWT generation, revenue sharing logic, audit logs, and search indexes:

```powershell
.venv\Scripts\python.exe run_production_tests.py
```

---

## 📁 Repository Architecture

```text
EstateFlow/
├── client/                     # React 19 + Vite Frontend
│   ├── src/
│   │   ├── api/                # Axios API Clients (Revenue, CRM, Bookings)
│   │   ├── components/         # Reusable UI, Calculators, Dropzone, Stepper
│   │   ├── contexts/           # Auth, AdminAuth, Toast, Theme
│   │   ├── layouts/            # AdminLayout, DashboardLayout
│   │   ├── pages/              # Admin & Customer Pages
│   │   └── router/             # React Router Config
├── server/                     # FastAPI Backend
│   ├── config/                 # Database & Settings
│   ├── core/                   # Security, Dependencies, JWT
│   ├── models/                 # SQLAlchemy ORM Models (User, Booking, Revenue)
│   ├── repositories/           # Data Repositories
│   ├── routers/                # REST API Endpoint Controllers
│   ├── schemas/                # Pydantic Schemas
│   └── services/               # Revenue Engine & Auth Services
├── Dockerfile                  # Production Multi-Stage Container Build
├── docker-compose.yml          # Container Compose Manifest
├── .env.example                # Environment Template
└── run_production_tests.py     # End-to-End Verification Test Script
```
