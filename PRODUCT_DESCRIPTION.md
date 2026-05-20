# ![Inventory Management Logo](logo.png)

# Inventory Management Application

## Overview
*Welcome to the **Inventory Management** solution – a friendly, powerful tool that helps businesses keep track of stock, streamline requisitions, and generate insightful reports. Whether you’re a seasoned manager or just getting started, this guide will walk you through the key capabilities and how to get the most out of the system.*

---

## 🎯 Key Benefits
| Benefit | Description |
|---|---|
| **Real‑time Stock Visibility** | Instantly see what’s on hand, where it’s located, and when it needs replenishment. |
| **Automated Requisition Workflow** | Create, approve, and fulfill requisitions with minimal clicks. |
| **Robust Reporting & Export** | Generate detailed consumption, movement, and holding reports; export to Excel with one click. |
| **Secure Authentication** | Laravel Fortify provides safe login, password reset, and role‑based access. |
| **Mobile‑Responsive UI** | Clean, premium design powered by **shadcn/ui**, works on desktop and mobile. |
---

## 🚀 Core Features
### 1. Authentication & Authorization
- Secure login, registration, two‑factor, and password reset (Laravel Fortify). 
- Role‑based permissions (Admin, Manager, Staff) control what each user can see and do.

### 2. Dashboard & Analytics
- At‑a‑glance overview of total stock, low‑stock alerts, and recent activity.
- Interactive charts (via Chart.js) showing trends over time.

### 3. Inventory Management
- Add, edit, and archive products with images, SKUs, and unit‑of‑measure information.
- Track batch numbers, expiry dates, and location‑wise quantities.

### 4. Requisition & Purchase Workflow
- Create internal, departmental, or purchase requisitions.
- Automatic validation to prevent unauthorized stock issuance.
- Seamless hand‑off to the **Goods Received Note (GRN)** module for purchase orders.

### 5. Goods Received Note (GRN) Processing
- Bulk‑receive multiple items from a requisition.
- Record batch numbers, expiry dates, and update stock in a single transaction.

### 6. Reporting & Export
- Consumption, movement, holdings, and custom filterable reports.
- One‑click **Excel** export powered by **Maatwebsite/Excel**.

### 7. User & Role Management
- Manage staff, assign departments, and control access levels.
- Searchable department combobox for quick user creation.
---

## 🏗️ Technical Architecture (High‑Level)
```mermaid
flowchart LR
    subgraph Backend[Laravel Backend]
        A[API Controllers] --> B[Service Layer]
        B --> C[Database (MySQL)]
    end
    subgraph Frontend[React + Inertia]
        D[TSX Components] --> E[shadcn/ui]
        E --> F[Axios / Fetch API]
    end
    A -- JSON --> D
    style Backend fill:#f9f9f9,stroke:#333,stroke-width:1px
    style Frontend fill:#eef7ff,stroke:#333,stroke-width:1px
```
- **Backend:** Laravel 9, PHP 8.2, MySQL 8, Laravel Fortify for auth.
- **Frontend:** React 18, TypeScript, Inertia.js, shadcn/ui (Tailwind) for a premium look.
- **Design System:** Tailwind 3 with custom design tokens (colors, rounded corners) – easy to extend.
---

## 📦 Getting Started (Quick‑Start Guide)
1. **Clone the repository**
   ```bash
   git clone https://github.com/your‑org/inventory.git
   cd inventory
   ```
2. **Install backend dependencies**
   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   ```
3. **Install frontend dependencies**
   ```bash
   npm ci
   ```
4. **Set up the database**
   ```bash
   php artisan migrate --seed
   ```
5. **Run the development server**
   ```bash
   php artisan serve
   npm run dev
   ```
   Open <http://127.0.0.1:8000> in your browser.
---

## 📖 Usage Walk‑through
### Adding a New Product
1. Navigate to **Products → Add New**.
2. Fill in name, SKU, unit, price, and upload an image.
3. Click **Save** – the product appears instantly on the dashboard.

### Creating a Requisition
1. Click **Requisitions → New**.
2. Choose the type (Internal, Departmental, Purchase) – the form adjusts automatically.
3. Add line items, set quantities, and submit for approval.

### Processing a GRN
1. Once a purchase requisition is approved, go to **GRN → Create**.
2. Select the related requisition, check the received quantities, add batch/expiry info, and save.
3. Stock levels update automatically.
---

## ⚙️ Advanced Configuration
- **Design System Tweaks** – edit `tailwind.config.js` to change primary colors or rounding.
- **Extending Modules** – add new API routes in `routes/api.php` and corresponding controllers.
- **CI/CD** – the repo includes a GitHub Actions workflow (`laravel.yml`) for automated testing and deployment.
---

## 📞 Support & Resources
- **Documentation Site:** https://docs.inventory.example.com
- **Community Slack:** https://inventory‑slack.example.com
- **Contact:** support@inventory.example.com

---

*Ready to boost your inventory efficiency? Let’s get started!*
