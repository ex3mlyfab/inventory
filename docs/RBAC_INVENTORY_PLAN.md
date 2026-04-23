# RBAC Inventory Management System — Development Plan

## For: Federal Medical Centre (FMC) Abuja — Tertiary Hospital Setting

**Stack**: Laravel 13 + Inertia.js v3 + React 19 + Tailwind CSS v4 (shadcn/ui)
**Date**: April 23, 2026
**Status**: Planning Phase — Awaiting Approval

> This is a local copy of the implementation plan. 
> See the full plan in the artifact viewer for interactive feedback.

---

## Quick Reference

### Roles (8)
1. Super Admin | 2. Inventory Manager | 3. Procurement Officer | 4. Pharmacist
5. Ward/Dept Head | 6. Store Officer | 7. Biomedical Engineer | 8. Auditor

### Modules (8)
1. Dashboard | 2. Product Catalog | 3. Stock & Inventory | 4. Procurement
5. Dispensing | 6. Equipment & Assets | 7. Reports & Analytics | 8. Administration

### Packages to Install
**Backend**: spatie/laravel-permission, spatie/laravel-activitylog, barryvdh/laravel-dompdf, maatwebsite/excel, spatie/laravel-medialibrary
**Frontend**: @tanstack/react-table, recharts, react-hook-form, zod, date-fns + additional shadcn/ui components

### Implementation Phases (10 weeks)
- Phase 1 (Wk 1-2): Foundation + RBAC + Admin
- Phase 2 (Wk 3-4): Product Catalog + Core Inventory
- Phase 3 (Wk 5-6): Procurement Lifecycle
- Phase 4 (Wk 7-8): Dispensing + Controlled Substances
- Phase 5 (Wk 9-10): Equipment + Reports + Polish

### Key Decisions Needed
1. Database engine: MySQL 8.0+ or PostgreSQL 15+?
