# Task Log

## Internal Requisition MD Approval History

- Added per-item previous-release links to the Medical Director approval panel for internal requisitions.
- The dialog shows the most recent quantity actually released for the same product, requesting department, and issuing store, including its requisition reference and release date.
- When there is no qualifying prior release, the dialog reports that there is no previous approved request for the item.
- History is sourced from requisition fulfillment stock movements and only shown for a requisition awaiting Level 2 approval.
- Verification: PHP syntax check and project TypeScript check passed. ESLint reports existing page-level import/order, unused-symbol, and style violations. The PHP suite reports 1 passed and 41 failed during SQLite setup because an existing cleanup query uses MySQL-only `DELETE ... JOIN` syntax.