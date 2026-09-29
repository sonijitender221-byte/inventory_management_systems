# StockDesk — Inventory Management System (MERN)

A production-style starter inventory app based on the supplied build guide. It includes:

- First-time admin setup + JWT login
- Admin / Staff roles and protected routes
- Dashboard stats + last-7-days stock chart + category stock value chart
- Products with search, category/supplier/stock filters, sorting and pagination
- Categories and suppliers management
- Stock In / Stock Out / Adjust with permanent movement history
- Server-side protection against negative stock
- Admin-only user management
- CSV product export
- Responsive layout, loading states, empty states, confirmation dialogs and toast messages

## Requirements

- Node.js 20+ recommended
- MongoDB running locally OR a MongoDB Atlas connection string

## 1. Backend

Open a terminal:

```bash
cd backend
npm install
```

The ZIP includes `backend/.env` for local development. If you need to change MongoDB, edit it:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/inventory
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES=7d
CLIENT_URL=http://localhost:5173
```

Start:

```bash
npm run dev
```

Health check:

`http://localhost:5000/api/health`

You should get:

```json
{"ok":true}
```

## 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally:

`http://localhost:5173`

## First login

On a fresh database, the app automatically sends you to **Setup**. Create the first account; it becomes the admin. Public setup then closes.

## MongoDB Atlas

If you don't have local MongoDB, create an Atlas database and replace `MONGO_URI` in `backend/.env`. Keep the database name `inventory`.

## Production deployment

Backend can be deployed as a Node service (for example Render). Frontend can be deployed as a Vite static app (for example Vercel). Set:

Backend:
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES`
- `CLIENT_URL`

Frontend:
- `VITE_API_URL=https://YOUR-BACKEND/api`

The included `frontend/vercel.json` supports SPA refreshes.

## UI form layout update

All data-entry forms have been changed to a clean **top-to-bottom, single-column layout**. Labels appear above their fields, fields use full width, and action buttons stay at the bottom. This applies to product, supplier, category, user, stock, login, and setup forms.

The modal width and spacing were also adjusted so forms remain readable on desktop and mobile.

## Important

Do not commit `.env` files or real production secrets. The included `.env.example` files are safe templates.

## API

See `BUILD_GUIDE.md` for the full API reference and phase-by-phase specification.
