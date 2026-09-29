# Form Layout Update

The application forms now follow one consistent pattern:

1. Field label
2. Full-width input/select/textarea
3. Next field below it
4. Action buttons at the bottom

No two-column form layout is used for the main data-entry forms. The layout is responsive and remains single-column on desktop and mobile.

## Updated areas

- Products: Add/Edit Product
- Suppliers: Add/Edit Supplier
- Categories: Add/Edit Category
- Users: Add/Edit User
- Stock: Stock In / Stock Out / Adjust
- Authentication: Login / Initial Admin Setup

The shared styling is in `frontend/src/index.css` using `.form-stack`, `.form-field`, `.form-actions`, and `.stock-type-buttons`.
