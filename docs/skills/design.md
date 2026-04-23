# Design System Skill — MedStock Hospital Inventory
## Based on: Shopify Polaris Hospital Inventory (Stitch Project: "Hospital Inv")

> **MANDATORY**: This skill file governs the visual design of ALL components, pages, and layouts in this project. Every UI element must comply with these specifications. Non-compliance is a defect.

---

## 1. Creative Direction: "Polaris for Healthcare"

This system adapts Shopify's Polaris design language for a hospital inventory context. The signature **#008060 green** conveys trust, health, and operational efficiency. The overall aesthetic is **clean, clinical, data-dense yet breathable** — every screen serves healthcare professionals who need rapid access to critical supply data.

### Core Principles
- **Clarity over decoration** — Healthcare staff need instant data comprehension
- **Consistent surface hierarchy** — Use background shifts, not borders, to create depth
- **Polaris Card pattern** — All content groups live in white cards with 8px radius on a light surface background
- **Left sidebar navigation** — Persistent dark-branded sidebar with green active states
- **Green-anchored CTAs** — Primary actions always use brand green

---

## 2. Color Palette

### Brand Colors
| Token | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| `color-brand` | `#008060` | `--brand` | Primary green — CTAs, active states, links |
| `color-brand-dark` | `#004C3F` | `--brand-dark` | Pressed states, sidebar background, dark accents |
| `primary` | `#00654b` | `--primary` | Refined brand for buttons, badges |
| `primary-container` | `#008060` | `--primary-container` | Same as brand, used for containers |

### Surface Hierarchy
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#f6fbf6` | Page background (slight green tint) |
| `surface` | `#f6fbf6` | Canvas base |
| `surface-container-lowest` | `#ffffff` | Cards, modals, inputs (pure white) |
| `surface-container-low` | `#f0f5f0` | Secondary workspace |
| `surface-container` | `#eaefea` | Table header backgrounds |
| `surface-container-high` | `#e5e9e5` | Hover states, active row highlights |
| `surface-container-highest` | `#dfe4df` | Disabled states, tertiary elements |
| `surface-dim` | `#d6dbd7` | Sidebar backgrounds (grounding anchor) |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `color-success` | `#008060` | In Stock, Active, Approved, Delivered |
| `color-warning` | `#FFC453` | Low Stock, Pending, Expiring Soon |
| `color-critical` | `#D82C0D` | Out of Stock, Expired, Rejected, Overdue |
| `color-info` | `#005BD3` | Information banners, processing states |
| `error` | `#ba1a1a` | Form validation errors |
| `error-container` | `#ffdad6` | Error badge background |

### Text Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `on-surface` | `#181d1a` | Primary text, headings |
| `on-surface-variant` | `#3e4944` | Subheadings, secondary labels |
| `color-text-sub` | `#6D7175` | Description text, meta text |
| `outline` | `#6e7a73` | Subtle borders, dividers |
| `outline-variant` | `#bdc9c2` | Ghost borders (use sparingly) |
| `color-border` | `#E1E3E5` | Card borders, input borders |

### Sidebar Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Sidebar BG | `#004C3F` | Dark green sidebar background |
| Sidebar Active | `#008060` | Active nav item background |
| Sidebar Text | `#ffffff` | Nav item text |
| Sidebar Hover | `rgba(255,255,255,0.08)` | Nav item hover state |

---

## 3. Typography

**Font Family**: Inter (all roles — display, heading, body, caption, label)

| Role | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| Display | 42px | 700 | 1.2 | -0.02em | Hero metrics, landing pages |
| Heading (H1) | 24px | 600 | 1.3 | normal | Page titles |
| Heading (H2) | 20px | 600 | 1.3 | normal | Section headings |
| Heading (H3) | 16px | 600 | 1.4 | normal | Card headers |
| Body | 14px | 400 | 1.5 | normal | All body text, table cells |
| Caption | 12px | 400 | 1.4 | normal | Timestamps, helper text, meta |
| Button | 14px | 600 | 1 | normal | All button labels |
| Label | 12px | 500 | 1.4 | 0.02em | Form labels, column headers |

### Import
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

---

## 4. Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` / `space-1` | 4px | Inline icon gaps |
| `sm` / `space-2` | 8px | Compact padding, badge padding |
| `md` / `space-3` | 12px | Form field gaps |
| `base` / `space-4` | 16px | Standard padding, gutter, card padding |
| `lg` / `space-5` | 20px | Page margin |
| `xl` / `space-6` | 24px | Section spacing |
| `2xl` / `space-8` | 32px | Large section gaps |
| `3xl` / `space-12` | 48px | Major section separators |

### Layout Constants
- **Page horizontal padding**: 20px
- **Card internal padding**: 16px (standard) / 24px (large cards)
- **Gutter between cards**: 16px
- **Sidebar width**: 240px (expanded) / 72px (collapsed)

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 4px / 0.25rem | Inputs, small buttons |
| `DEFAULT` | 8px / 0.5rem | Cards, dropdowns, modals |
| `md` | 12px / 0.75rem | Large cards, feature sections |
| `lg` | 16px / 1rem | Special containers |
| `xl` | 24px / 1.5rem | Full-width banners |
| `full` | 9999px | Badges, pills, avatar |

---

## 6. Shadows & Elevation

| Level | Shadow | Usage |
|-------|--------|-------|
| None | `none` | Standard cards (use surface shift instead) |
| Subtle | `0 1px 0 rgba(0, 0, 0, 0.05)` | Card bottom edge |
| Card | `0 0 0 1px #E1E3E5, 0 1px 2px rgba(0, 0, 0, 0.1)` | Polaris card standard |
| Dropdown | `0 4px 12px rgba(0, 0, 0, 0.12)` | Menus, popovers |
| Modal | `0 20px 60px rgba(0, 0, 0, 0.2)` | Modal overlay |

### Elevation Rule
- Prefer **surface color shifts** over shadows for creating hierarchy
- Use `outline-variant` (#bdc9c2) at low opacity for ghost borders when needed
- Cards use `border: 1px solid #E1E3E5` — the Polaris standard

---

## 7. Component Specifications

### 7.1 Sidebar Navigation
```
Layout:
├── Logo area (h: 60px, brand green bg)
├── Navigation group (scrollable)
│   ├── Nav item (h: 40px, px: 12px, rounded: 8px)
│   │   ├── Icon (20px, opacity: 0.7 inactive)
│   │   └── Label (14px, weight: 500)
│   └── Active state: bg #008060, icon+text white
└── User area (bottom-pinned)
```
- **Background**: `#004C3F` (dark brand green)
- **Active Item**: `#008060` background, white text
- **Hover**: `rgba(255, 255, 255, 0.08)` overlay
- **Dividers between groups**: 1px `rgba(255, 255, 255, 0.12)` line
- **Icon + label gap**: 12px
- **Nav icons**: 20×20px Lucide icons, stroke-width: 1.5

### 7.2 Stat/Metric Cards
```
┌─────────────────────────────────────┐
│  🏷️ Label        (12px, #6D7175)   │
│  2,847           (28px, 700, #181d1a)│
│  ↑ 12% vs last   (12px, #008060)    │
│  month                               │
└─────────────────────────────────────┘
```
- **Background**: `#ffffff` (surface-container-lowest)
- **Border**: `1px solid #E1E3E5`
- **Border-radius**: 8px
- **Padding**: 16px
- **Trend indicator**: Green for positive, red for negative
- **Layout**: Usually displayed in a 4-column grid

### 7.3 Data Tables (Polaris Resource List)
```
┌──────────────────────────────────────────────────────────┐
│ ☐ Product    SKU       Stock   Status   Expiry   Actions │  ← Header
├──────────────────────────────────────────────────────────┤
│ ☐ Item 1     MED-001   120    ●Active  2024-12  ⋯       │  ← Row
│ ☐ Item 2     MED-002   5      ●Low     2024-06  ⋯       │  ← Row
├──────────────────────────────────────────────────────────┤
│ ← 1 2 3 ... 10 →          Showing 1-20 of 245           │  ← Footer
└──────────────────────────────────────────────────────────┘
```
- **Header row**: `#f6f6f7` bg, `#6D7175` text, 12px uppercase, weight 500
- **Body rows**: White bg, 14px text, 48px row height
- **Row hover**: `#f6fbf6` (surface background)
- **Selected row**: `#e0f4eb` (light green tint)
- **Row border**: `1px solid #E1E3E5` bottom only
- **Checkbox column**: 40px wide, centered
- **Actions column**: Kebab menu (⋯) or icon buttons
- **Pagination**: Bottom-right, outline buttons, current page filled

### 7.4 Status Badges
| Status | Background | Text Color | Border |
|--------|-----------|------------|--------|
| In Stock/Active | `#e0f4eb` | `#006e3c` | none |
| Low Stock/Warning | `#fff3cd` | `#856404` | none |
| Out of Stock/Critical | `#fce4ec` | `#c62828` | none |
| Expired | `#ffdad6` | `#ba1a1a` | none |
| Pending | `#e3f2fd` | `#1565c0` | none |
| Draft | `#f3f3f3` | `#6D7175` | none |

- **Shape**: `border-radius: 9999px` (pill)
- **Padding**: `2px 10px`
- **Font**: 12px, weight 500
- **Max width**: Content-fit, no wrapping

### 7.5 Buttons
| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | `#008060` | `#ffffff` | none | `#006e52` |
| Secondary | `#ffffff` | `#202223` | `1px solid #babfc3` | `#f6f6f7` bg |
| Destructive | `#D82C0D` | `#ffffff` | none | `#bc2200` |
| Ghost | transparent | `#008060` | none | `#f6f6f7` bg |
| Outline | `#ffffff` | `#202223` | `1px solid #E1E3E5` | `#f6f6f7` bg |

- **Height**: 36px (default), 28px (small), 44px (large)
- **Padding**: `8px 16px` (default), `4px 12px` (small)
- **Border-radius**: 8px
- **Font**: 14px, weight 600
- **Icon + text gap**: 8px
- **One primary button per section maximum**

### 7.6 Form Inputs
- **Height**: 36px
- **Border**: `1px solid #babfc3`
- **Border-radius**: 8px
- **Padding**: `6px 12px`
- **Focus ring**: `0 0 0 2px #008060` (brand green outline)
- **Error state**: `1px solid #D82C0D`, error text below in 12px #D82C0D
- **Label**: 12px weight 500, `#202223`, 4px gap below
- **Placeholder**: `#6D7175`

### 7.7 Cards (Polaris Card)
- **Background**: `#ffffff`
- **Border**: `1px solid #E1E3E5`
- **Border-radius**: 8px
- **Shadow**: `0 1px 0 rgba(0, 0, 0, 0.05)` (subtle bottom)
- **Header**: 16px padding, optional action button right-aligned
- **Body**: 16px padding, sections divided by `1px solid #E1E3E5`
- **Footer**: 16px padding, muted text or action links

### 7.8 Modals / Dialogs
- **Overlay**: `rgba(0, 0, 0, 0.5)`
- **Width**: 640px (standard), 480px (confirm), 800px (large)
- **Border-radius**: 12px
- **Header**: 20px padding, 18px weight 600 title, close button
- **Body**: 20px padding
- **Footer**: 16px padding, right-aligned buttons, separated by border

### 7.9 Alert Banners
| Type | Background | Border-left | Icon Color |
|------|-----------|------------|------------|
| Info | `#eaf5ff` | `4px solid #005BD3` | `#005BD3` |
| Success | `#e0f4eb` | `4px solid #008060` | `#008060` |
| Warning | `#fff3cd` | `4px solid #B98900` | `#B98900` |
| Critical | `#fce4ec` | `4px solid #D82C0D` | `#D82C0D` |

- **Border-radius**: 8px
- **Padding**: 12px 16px
- **Dismiss**: X button, top-right

---

## 8. Page Layout Patterns

### Standard List Page (e.g., Stock Inventory List, Suppliers Directory)
```
┌──────────────────────────────────────────────────────┐
│ Sidebar │  Page Header: Title + Primary Action Button │
│         │─────────────────────────────────────────────│
│         │  Filter Bar: Search | Status | Category     │
│         │─────────────────────────────────────────────│
│         │  ┌─ Stat Cards (4-column grid) ──────────┐ │
│         │  │ Total │ In Stock │ Low │ Expired       │ │
│         │  └───────────────────────────────────────-┘ │
│         │  ┌─ Data Table ──────────────────────────┐ │
│         │  │ Header row                             │ │
│         │  │ Data rows...                           │ │
│         │  │ Pagination footer                      │ │
│         │  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Detail/Show Page (e.g., Product Detail, Supplier Profile)
```
┌──────────────────────────────────────────────────────┐
│ Sidebar │  Breadcrumb: Module > List > Item Name      │
│         │─────────────────────────────────────────────│
│         │  ┌─ Header Card ─────────────────────────┐ │
│         │  │ Name + Status Badge + Action Buttons   │ │
│         │  └────────────────────────────────────────┘ │
│         │  ┌─ 2-column layout ─────────────────────┐ │
│         │  │ Info Card (2/3)  │ Summary Card (1/3) │ │
│         │  └────────────────────────────────────────┘ │
│         │  ┌─ Related Table ───────────────────────┐ │
│         │  │ e.g., Stock Batches, Order History     │ │
│         │  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Form Page (e.g., Add Product, Stock Adjustment)
```
┌──────────────────────────────────────────────────────┐
│ Sidebar │  Breadcrumb: Module > Action                │
│         │─────────────────────────────────────────────│
│         │  ┌─ Form Card (max-width: 720px) ────────┐ │
│         │  │ Section Title                           │ │
│         │  │ Form fields (2-col grid)               │ │
│         │  │ ──── Section Divider ────               │ │
│         │  │ Section Title                           │ │
│         │  │ More fields                             │ │
│         │  │ ──── Footer ────                        │ │
│         │  │ [Cancel]                    [Save] (green)│ │
│         │  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Dashboard Page
```
┌──────────────────────────────────────────────────────┐
│ Sidebar │  Welcome, {Name}  |  Date & Role Badge      │
│         │─────────────────────────────────────────────│
│         │  ┌─ Stat Cards (4-col) ──────────────────┐ │
│         │  │ Total Items │ Low Stock │ Expiring │ .. │ │
│         │  └────────────────────────────────────────┘ │
│         │  ┌─ Charts (2-col) ──────────────────────┐ │
│         │  │ Stock Trend (line) │ Category (donut)  │ │
│         │  └────────────────────────────────────────┘ │
│         │  ┌─ Recent Activity Table ───────────────┐ │
│         │  │ Recent stock movements / alerts         │ │
│         │  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 9. CSS Custom Properties

Every component must use these CSS variables. Hard-coding hex values is prohibited.

```css
:root {
  /* Brand */
  --brand: #008060;
  --brand-dark: #004C3F;
  --brand-light: #e0f4eb;

  /* Surfaces */
  --surface: #f6fbf6;
  --surface-card: #ffffff;
  --surface-header: #f6f6f7;
  --surface-hover: #f6fbf6;
  --surface-selected: #e0f4eb;
  --surface-sidebar: #004C3F;

  /* Text */
  --text-primary: #181d1a;
  --text-secondary: #3e4944;
  --text-muted: #6D7175;
  --text-on-brand: #ffffff;

  /* Borders */
  --border-default: #E1E3E5;
  --border-input: #babfc3;
  --border-focus: #008060;

  /* Semantic */
  --success: #008060;
  --success-bg: #e0f4eb;
  --warning: #B98900;
  --warning-bg: #fff3cd;
  --critical: #D82C0D;
  --critical-bg: #fce4ec;
  --info: #005BD3;
  --info-bg: #eaf5ff;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* Radii */
  --radius-sm: 4px;
  --radius-default: 8px;
  --radius-md: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-card: 0 0 0 1px #E1E3E5, 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-dropdown: 0 4px 12px rgba(0, 0, 0, 0.12);
  --shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.2);
}
```

---

## 10. Screens Reference (Stitch Project)

The following screens exist in the Stitch "Hospital Inv" project and should be referenced when building corresponding features:

| Screen Name | Module | Key Patterns |
|------------|--------|--------------|
| Inventory Dashboard | Dashboard | Stat cards, line charts, donut charts, recent activity |
| Stock Inventory List | Inventory | Resource table, status badges, filters, bulk actions |
| Product Detail: N95 Respirator | Inventory | Detail card, batch table, stock history |
| Inventory Analytics | Reports | Multi-chart layout, trend lines, KPI cards |
| Stock Adjustment Form | Inventory | Multi-step form, reason codes, quantity inputs |
| Suppliers Directory | Procurement | Supplier cards/list, contact info, rating |
| Supplier Profile: BioMed | Procurement | Detail page, order history, contract info |
| Procurement Management | Procurement | PO workflow, status pipeline, approval chain |
| Price Comparison Tool | Procurement | Side-by-side comparison, differential highlights |
| Contract Renewal Form | Procurement | Long form, date pickers, file upload |
| Warehouse Directory | Inventory | Location cards, capacity bars, map |
| Add New Warehouse | Inventory | Multi-section form, zone configuration |
| Picking List | Dispensing | Printable task list, checkboxes, priority badges |
| Fulfillment Queue | Dispensing | Kanban-like queue, priority sorting |
| Departmental Request Portal | Dispensing | Request form, approval workflow |
| Budget Approval Dashboard | Admin | Approval pipeline, budget cards, charts |
| Budget Approval Detail | Admin | Detail view, approval timeline, comments |
| User Permissions Management | Admin | Role matrix, checkbox grid, user list |
| Audit Logs | Admin | Activity log table, filters, expandable rows |
| Disposal Log Tracking | Compliance | Disposal records, certification status |
| Disposal Certification | Compliance | Certificate detail, signoff fields |
| Waste Tracking Report | Compliance | Waste metrics, trend charts, category breakdown |
| Monthly Compliance Summary | Reports | Multi-section report, charts, compliance scores |
| Predictive Replenishment | Reports | AI-driven cards, forecast charts, alerts |
| Safety Protocol | Compliance | Protocol document, checklist, version history |
| Hazardous Waste Alerts | Compliance | Alert cards, severity badges, action items |
| Transport & Delivery Tracking | Logistics | Shipment timeline, map, status pipeline |
| Login - MedStock | Auth | Split layout, brand illustration, form |
| Welcome to MedStock | Onboarding | Setup wizard, progress steps |
| Select Your Role | Onboarding | Role selection cards |
| Setup Complete | Onboarding | Success state, next steps |

---

## 11. Do's and Don'ts

### ✅ DO
- **DO** use `--brand` (`#008060`) for ALL primary action buttons
- **DO** use Polaris card pattern (white bg, 1px border, 8px radius) for content groups
- **DO** display stat cards in a 4-column grid at the top of dashboard/list pages
- **DO** use status badges with pill shape and semantic background colors
- **DO** maintain 16px gutter between all cards and sections
- **DO** use Inter font family exclusively — no font mixing
- **DO** use the sidebar nav pattern with dark green background
- **DO** keep one primary (green) button per section maximum
- **DO** use breadcrumbs on every page below dashboard
- **DO** implement search + filter bar above every data table
- **DO** use `surface-container` tiers for creating hierarchy

### ❌ DON'T
- **DON'T** use arbitrary colors — always reference CSS custom properties
- **DON'T** use more than one primary button per visual section
- **DON'T** place destructive (red) buttons next to primary (green) without spacing
- **DON'T** use heavy drop shadows — prefer border + surface shift
- **DON'T** override the spacing scale with arbitrary pixel values
- **DON'T** use all-caps for body text (only for small labels and column headers)
- **DON'T** crowd the interface — if a table feels tight, increase row padding to 48px
- **DON'T** use colored backgrounds for form sections — keep them white
- **DON'T** place charts without context labels and legends
