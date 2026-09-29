import { configureStore } from "@reduxjs/toolkit";
import auth from "../features/auth/authSlice";
import products from "../features/products/productSlice";
import categories from "../features/categories/categorySlice";
import suppliers from "../features/suppliers/supplierSlice";
import stock from "../features/stock/stockSlice";
import dashboard from "../features/dashboard/dashboardSlice";
import users from "../features/users/userSlice";

export const store = configureStore({
  reducer: { auth, products, categories, suppliers, stock, dashboard, users },
});