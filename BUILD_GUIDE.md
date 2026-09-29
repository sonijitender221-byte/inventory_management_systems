# Inventory Management System (MERN): Build It Phase by Phase

## Before anything: what are we building?

Think of a shop owner or a small warehouse. Every day stuff comes in (new stock from suppliers) and stuff goes out (sales, damage, returns). The owner needs to know, at any moment:

- What do I have, and how many of each?
- What is about to run out?
- How much money is sitting on my shelves?
- Who added or removed stock, and when?

We will build a proper web app that answers all of this. Not a toy. Something a real shop could log into and use.

### The full feature list

| Area | What it does |
|---|---|
| **Login and roles** | People log in with email and password. There are two kinds of users: **Admin** (can do everything) and **Staff** (can view things and record stock in/out, but can't delete or manage users). |
| **First-time setup** | The very first person who opens the app creates the admin account. After that, public sign-up is closed. Only the admin can add new staff. |
| **Dashboard** | Big number cards (total products, total units, stock value, low stock, out of stock), a bar chart of stock in vs out for the last 7 days, a chart of stock value by category, a "running low" list and a "recent activity" list. |
| **Products** | Add, edit, delete products. Each has a name, SKU (product code), category, supplier, unit, cost price, selling price, quantity and reorder level. |
| **Search, filter, sort, pages** | Search by name or SKU. Filter by category, supplier, and stock status (in stock / low / out). Sort by name, quantity, price, newest. 10 per page with next/previous. |
| **Stock status badges** | Green "In stock", orange "Low stock", red "Out of stock". Worked out automatically. |
| **Categories** | Add, rename, delete. You can't delete a category that still has products in it. |
| **Suppliers** | Add, edit, delete suppliers with contact name, phone, email and address. |
| **Stock movements** | Record **Stock In** (goods arrived), **Stock Out** (sold/used/damaged) and **Adjust** (you counted the shelf and the real number is different). Every movement is saved forever with who did it, when, before and after numbers, and a note. |
| **Never negative** | You can't take out more than you have. The server blocks it, not just the screen. |
| **Movement history** | A full log you can filter by product, type and date. |
| **Users (admin only)** | Add staff, change role, disable an account. |
| **Export** | Download the product list as a CSV file (opens in Excel). |
| **Nice touches** | Loading spinners, toast pop-ups for success and errors, "are you sure?" before delete, empty-state messages, works on mobile, 404 page. |

### The tools (MERN plus helpers)

| Tool | Where | Why |
|---|---|---|
| MongoDB + Mongoose | backend | Stores the data. Mongoose lets us describe what a "product" looks like and checks the data before saving. |
| Express | backend | Receives requests from the website and sends back answers. |
| bcryptjs | backend | Scrambles passwords so we never store the real one. |
| jsonwebtoken (JWT) | backend | Gives a logged-in user a "pass" (token) that proves who they are on every request. |
| cors, dotenv, morgan | backend | Allow the frontend to talk to us, read secrets from `.env`, print each request in the terminal. |
| React + Vite | frontend | Builds the screens. Vite runs it fast. |
| Redux Toolkit | frontend | One central box for all app data (logged-in user, products, etc). |
| React Router | frontend | Different pages with different URLs. |
| Axios | frontend | Makes calls to the backend. |
| Tailwind CSS | frontend | Styling with small class names, no big CSS files. |
| Recharts | frontend | The charts on the dashboard. |
| react-hot-toast, lucide-react | frontend | Pop-up messages and icons. |

---

## Working on your branch (Neelam, Jeet, Vikram)

Each of you has your own branch: `neelam`, `jeet`, `vikram`. You build the whole project on your own branch. Nobody touches `main`.

```bash
git checkout neelam          # use your own name
git pull                     # get the latest
```

At the end of **every phase**, save your work:

```bash
git add .
git commit -m "phase 3: login and roles"
git push -u origin neelam    # first time; after that just: git push
```

Rule: one commit per phase at minimum. If your code breaks later, you can always go back to the last phase that worked.

---

## Final folder layout

This is where we're heading. Don't create it all now, it gets built phase by phase.

```
inventory-management-system/
  backend/
    server.js
    .env
    .env.example
    src/
      config/db.js
      middleware/auth.js
      middleware/error.js
      utils/AppError.js
      models/        User.js  Category.js  Supplier.js  Product.js  StockMovement.js
      controllers/   auth  users  categories  suppliers  products  stock  dashboard
      routes/        same names as controllers
  frontend/
    .env
    src/
      api/axios.js
      app/store.js
      features/      auth  products  categories  suppliers  stock  dashboard  users (one slice each)
      components/    Layout  Sidebar  Topbar  Modal  ConfirmDialog  StockBadge  Pagination  Spinner  EmptyState  ProtectedRoute
      pages/         Login  Setup  Dashboard  Products  Categories  Suppliers  Stock  Users  NotFound
      utils/format.js
      App.jsx
      main.jsx
  BUILD_GUIDE.md
```

---

# PART A: THE BACKEND

## Phase 1: Set up the backend

**Goal:** a server that starts, connects to MongoDB and answers "I'm alive".

1. Go into the backend folder and start a project:
   ```bash
   cd backend
   npm init -y
   npm install express mongoose cors dotenv bcryptjs jsonwebtoken morgan
   npm install -D nodemon
   ```
2. Open `package.json` and add these two things:
   ```json
   "type": "module",
   "scripts": {
     "dev": "nodemon server.js",
     "start": "node server.js"
   }
   ```
   `"type": "module"` lets us write `import` instead of `require`.

3. Create `.env` (secrets, never pushed to GitHub):
   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/inventory
   JWT_SECRET=put-a-long-random-sentence-here
   JWT_EXPIRES=7d
   CLIENT_URL=http://localhost:5173
   ```
   Also create `.env.example` with the same keys but fake values. That one **is** pushed, so others know what to fill in.

4. `src/config/db.js`:
   ```js
   import mongoose from "mongoose";

   export default async function connectDB() {
     try {
       await mongoose.connect(process.env.MONGO_URI);
       console.log("MongoDB connected");
     } catch (err) {
       console.error("MongoDB connection failed:", err.message);
       process.exit(1);
     }
   }
   ```

5. `src/utils/AppError.js`. A normal error, but it also carries a status code (400, 404 and so on):
   ```js
   export default class AppError extends Error {
     constructor(message, status = 400) {
       super(message);
       this.status = status;
     }
   }
   ```

6. `src/middleware/error.js`. One place that turns every error into a clean JSON reply:
   ```js
   export const notFound = (req, res) => {
     res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
   };

   export const errorHandler = (err, req, res, next) => {
     let status = err.status || 500;
     let message = err.message || "Server error";

     if (err.name === "ValidationError") {
       status = 400;
       message = Object.values(err.errors).map((e) => e.message).join(", ");
     }
     if (err.name === "CastError") {
       status = 400;
       message = "Invalid id";
     }
     if (err.code === 11000) {
       status = 409;
       message = `${Object.keys(err.keyValue)[0]} already exists`;
     }

     res.status(status).json({ message });
   };
   ```
   Why: without this, a bad request crashes with an ugly HTML page. With it, the frontend always gets `{ message: "..." }` and can show it.

7. `server.js`:
   ```js
   import express from "express";
   import cors from "cors";
   import morgan from "morgan";
   import dotenv from "dotenv";
   import connectDB from "./src/config/db.js";
   import { notFound, errorHandler } from "./src/middleware/error.js";

   dotenv.config();
   await connectDB();

   const app = express();
   app.use(cors({ origin: process.env.CLIENT_URL }));
   app.use(express.json());
   app.use(morgan("dev"));

   app.get("/api/health", (req, res) => res.json({ ok: true }));

   // routes get added here in the next phases

   app.use(notFound);
   app.use(errorHandler);

   const PORT = process.env.PORT || 5000;
   app.listen(PORT, () => console.log(`Server running on ${PORT}`));
   ```

8. Run `npm run dev` and open `http://localhost:5000/api/health`. You should see `{"ok":true}`.

> **Good to know:** we're on Express 5. If an `async` function throws an error, Express 5 catches it and sends it to `errorHandler` by itself. So we don't need `try/catch` in every controller. We just `throw new AppError("...", 404)`.

**Commit:** `phase 1: backend setup`

---

## Phase 2: Users, login and roles

**Goal:** people can log in, get a token, and the server knows who they are and what they're allowed to do.

### How login works, in plain words

1. You send email + password.
2. Server finds the user, checks the password against the scrambled one.
3. If correct, server gives you a **token**. Think of it as a wristband at an event.
4. On every next request, the frontend shows the wristband (sends the token in a header).
5. The server checks the wristband and knows who you are. No wristband, no entry.

### The User model: `src/models/User.js`

```js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: [6, "Password must be at least 6 characters"], select: false },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// scramble the password before saving, but only if it was changed
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model("User", userSchema);
```

`select: false` means the password is never sent back unless we ask for it on purpose.

### The guards: `src/middleware/auth.js`

```js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

// guard 1: are you logged in?
export const protect = async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw new AppError("Please log in", 401);

  let decoded;
  try {
    decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    throw new AppError("Session expired, please log in again", 401);
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new AppError("Account not found or disabled", 401);

  req.user = user;
  next();
};

// guard 2: are you allowed? use like allow("admin")
export const allow = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw new AppError("You don't have permission to do this", 403);
  next();
};
```

### The controller: `src/controllers/authController.js`

```js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });

const userOut = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role });

// is this a brand new install? (no users yet)
export const setupStatus = async (req, res) => {
  const count = await User.countDocuments();
  res.json({ needsSetup: count === 0 });
};

// only works when there are zero users. That first person becomes admin.
export const setup = async (req, res) => {
  if (await User.countDocuments()) throw new AppError("Setup already done. Ask your admin for an account.", 403);
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password, role: "admin" });
  res.status(201).json({ token: makeToken(user._id), user: userOut(user) });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError("Email and password are required", 400);

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) throw new AppError("Wrong email or password", 400);
  if (!user.isActive) throw new AppError("Your account is disabled", 403);

  res.json({ token: makeToken(user._id), user: userOut(user) });
};

export const me = (req, res) => res.json({ user: userOut(req.user) });
```

Note: wrong password returns **400**, not 401. We keep 401 only for "your token is bad", so the frontend knows when to kick you back to login.

### Users (admin only): `src/controllers/userController.js`

| Function | What it does |
|---|---|
| `getUsers` | List all users, newest first. |
| `createUser` | Admin makes a new user (name, email, password, role). |
| `updateUser` | Change name, role, or `isActive`. If a new password is sent, set it and call `.save()` so it gets scrambled. |

One safety rule inside `updateUser`: an admin can't disable themselves or remove their own admin role. Otherwise you could lock everyone out.

```js
if (String(req.params.id) === String(req.user._id) && (req.body.isActive === false || req.body.role === "staff")) {
  throw new AppError("You can't disable or demote yourself", 400);
}
```

### Routes

`src/routes/authRoutes.js`
```js
import { Router } from "express";
import { setupStatus, setup, login, me } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.get("/setup-status", setupStatus);
router.post("/setup", setup);
router.post("/login", login);
router.get("/me", protect, me);
export default router;
```

`src/routes/userRoutes.js`
```js
const router = Router();
router.use(protect, allow("admin"));   // every route below needs admin
router.route("/").get(getUsers).post(createUser);
router.patch("/:id", updateUser);
export default router;
```

Add to `server.js`:
```js
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
```

**Test in Postman / Thunder Client:**
1. `GET /api/auth/setup-status` → `needsSetup: true`
2. `POST /api/auth/setup` with name, email, password → you get a token.
3. `POST /api/auth/setup` again → 403. Good, setup is closed.
4. `GET /api/auth/me` with header `Authorization: Bearer <token>` → your user.

**Commit:** `phase 2: auth and roles`

---

## Phase 3: Categories and Suppliers

**Goal:** the two simple lists that products will point to.

### Models

`Category.js`
```js
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Category name is required"], unique: true, trim: true },
    description: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);
```

`Supplier.js`
```js
const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Supplier name is required"], trim: true },
    contactPerson: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);
```

### Controllers (same shape for both)

| Function | Method + URL | Who |
|---|---|---|
| list | `GET /api/categories` | any logged-in user |
| create | `POST /api/categories` | admin |
| update | `PUT /api/categories/:id` | admin |
| remove | `DELETE /api/categories/:id` | admin |

Same four for `/api/suppliers`.

For the list, also send back **how many products** are in each category, so the UI can show it:

```js
export const getCategories = async (req, res) => {
  const categories = await Category.aggregate([
    { $lookup: { from: "products", localField: "_id", foreignField: "category", as: "products" } },
    { $addFields: { productCount: { $size: "$products" } } },
    { $project: { products: 0 } },
    { $sort: { name: 1 } },
  ]);
  res.json(categories);
};
```

For update, always use `{ new: true, runValidators: true }` so you get the updated version back and the rules still apply:

```js
const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
if (!category) throw new AppError("Category not found", 404);
```

**The delete rule:** don't delete a category or supplier that products still use. Otherwise those products point to nothing.

```js
export const deleteCategory = async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse) throw new AppError(`Can't delete: ${inUse} product(s) still use this category`, 400);
  const deleted = await Category.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError("Category not found", 404);
  res.json({ _id: req.params.id });
};
```

(You'll create the Product model in the next phase. Write the delete check now and it'll work once Product exists.)

Routes file pattern:
```js
router.use(protect);
router.route("/").get(getCategories).post(allow("admin"), createCategory);
router.route("/:id").put(allow("admin"), updateCategory).delete(allow("admin"), deleteCategory);
```

**Commit:** `phase 3: categories and suppliers`

---

## Phase 4: Products

**Goal:** the heart of the app. Full add/edit/delete plus search, filter, sort and pages.

### The model: `src/models/Product.js`

```js
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true },
    sku: { type: String, required: [true, "SKU is required"], unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: [true, "Pick a category"] },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    unit: { type: String, enum: ["pcs", "box", "kg", "g", "litre", "ml", "pack", "dozen"], default: "pcs" },
    costPrice: { type: Number, required: true, min: [0, "Cost price can't be negative"] },
    sellingPrice: { type: Number, required: true, min: [0, "Selling price can't be negative"] },
    quantity: { type: Number, default: 0, min: [0, "Quantity can't be negative"] },
    reorderLevel: { type: Number, default: 10, min: 0 },
  },
  { timestamps: true }
);
```

What's what:
- **SKU**: a short unique code for the product, like `PEN-BLU-01`. Shops use it on labels and barcodes.
- **Cost price**: what you paid. **Selling price**: what you sell for. Stock value uses cost price.
- **Reorder level**: when quantity drops to this number or below, it's "low stock" and you should order more.

### A very important rule

> **After a product is created, its quantity is never edited directly.** It only changes through Stock In / Stock Out / Adjust (Phase 5).

Why? If anyone can just type a new number into the quantity box, you have no idea where stock went. Real inventory systems always keep a paper trail. So:

- **Create product:** you may give an opening quantity. We save it, and also log it as a Stock In movement called "Opening stock".
- **Update product:** we remove `quantity` from whatever was sent, so it can't be changed here.

```js
export const updateProduct = async (req, res) => {
  const { quantity, ...changes } = req.body;   // throw away quantity
  const product = await Product.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true })
    .populate("category", "name")
    .populate("supplier", "name");
  if (!product) throw new AppError("Product not found", 404);
  res.json(product);
};
```

```js
export const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  if (product.quantity > 0) {
    await StockMovement.create({
      product: product._id, productName: product.name, type: "IN",
      quantity: product.quantity, change: product.quantity,
      before: 0, after: product.quantity, note: "Opening stock", user: req.user._id,
    });
  }
  await product.populate([{ path: "category", select: "name" }, { path: "supplier", select: "name" }]);
  res.status(201).json(product);
};
```

### The list: search + filter + sort + pages

The frontend will call something like:
`GET /api/products?search=pen&category=<id>&stock=low&sort=-quantity&page=2&limit=10`

```js
const SORTS = ["name", "-name", "quantity", "-quantity", "sellingPrice", "-sellingPrice", "createdAt", "-createdAt"];
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getProducts = async (req, res) => {
  const { search = "", category, supplier, stock, sort = "-createdAt" } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 10);

  const filter = {};
  if (search) {
    const rx = { $regex: escape(search), $options: "i" };
    filter.$or = [{ name: rx }, { sku: rx }];
  }
  if (category) filter.category = category;
  if (supplier) filter.supplier = supplier;
  if (stock === "out") filter.quantity = 0;
  if (stock === "low") filter.$expr = { $and: [{ $gt: ["$quantity", 0] }, { $lte: ["$quantity", "$reorderLevel"] }] };
  if (stock === "in") filter.$expr = { $gt: ["$quantity", "$reorderLevel"] };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name")
      .populate("supplier", "name")
      .sort(SORTS.includes(sort) ? sort : "-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
};
```

In plain words:
- `$regex` with `"i"` = "contains this text, ignore capital letters". `escape` stops someone typing weird symbols from breaking it.
- `$expr` lets us compare two fields of the same product (quantity vs reorderLevel).
- `SORTS` is a list of allowed sorts, so nobody can sort by something silly.
- `skip` and `limit` give pages. Page 2 with limit 10 skips the first 10.
- We run the find and the count at the same time with `Promise.all`, it's faster.

### All product routes

| Method + URL | What | Who |
|---|---|---|
| `GET /api/products` | list (with the query options above) | anyone logged in |
| `GET /api/products/:id` | one product | anyone logged in |
| `POST /api/products` | create | admin |
| `PUT /api/products/:id` | update (not quantity) | admin |
| `DELETE /api/products/:id` | delete | admin |
| `GET /api/products/export` | download CSV | anyone logged in |

**Watch out:** put the `/export` route **above** `/:id`, otherwise Express thinks "export" is an id.

### CSV export

```js
export const exportProducts = async (req, res) => {
  const products = await Product.find().populate("category", "name").populate("supplier", "name").sort("name");
  const clean = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Name", "SKU", "Category", "Supplier", "Unit", "Cost", "Price", "Quantity", "Reorder Level", "Stock Value"];
  const rows = products.map((p) => [
    p.name, p.sku, p.category?.name, p.supplier?.name, p.unit,
    p.costPrice, p.sellingPrice, p.quantity, p.reorderLevel, p.quantity * p.costPrice,
  ]);
  const csv = [header, ...rows].map((r) => r.map(clean).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=products.csv");
  res.send(csv);
};
```

Every value is wrapped in quotes so a comma inside a product name doesn't break the columns.

**Commit:** `phase 4: products api`

---

## Phase 5: Stock movements (in, out, adjust)

**Goal:** the only way quantity changes. Every change is logged.

### The three types

| Type | Real life | What happens to quantity |
|---|---|---|
| **IN** | A delivery arrived from the supplier | quantity **+** number |
| **OUT** | Sold, used, damaged, expired | quantity **−** number (blocked if not enough) |
| **ADJUST** | You physically counted and the shelf has a different number | quantity **becomes** the number you counted |

### The model: `src/models/StockMovement.js`

```js
const movementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },   // kept even if product is deleted later
    type: { type: String, enum: ["IN", "OUT", "ADJUST"], required: true },
    quantity: { type: Number, required: true, min: 0 },  // the number the user typed
    change: { type: Number, required: true },            // +20, -5, -3 ... the real difference
    before: { type: Number, required: true },
    after: { type: Number, required: true },
    note: { type: String, trim: true, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);
```

We save `productName` as plain text too. If the product gets deleted one day, the history still says what it was.

### The controller: the careful part

Problem: two staff members click "Stock Out 5" at the same second, and there are only 6 left. If we first read the number and then save a new number, both see 6, both save 1, and we've actually sold 10 from 6. Wrong.

Fix: ask MongoDB to do the check and the change **in one single step**: "take 5 off, but only if there are at least 5". MongoDB does this safely even if many requests come at once.

```js
export const createMovement = async (req, res) => {
  const { productId, type, note = "" } = req.body;
  const qty = Number(req.body.quantity);

  if (!["IN", "OUT", "ADJUST"].includes(type)) throw new AppError("Type must be IN, OUT or ADJUST", 400);
  if (!Number.isInteger(qty) || qty < 0) throw new AppError("Quantity must be a whole number, 0 or more", 400);
  if (type !== "ADJUST" && qty === 0) throw new AppError("Quantity must be more than 0", 400);
  if (type === "ADJUST" && !note.trim()) throw new AppError("Please give a reason for the adjustment", 400);

  const condition = { _id: productId };
  let update;
  if (type === "IN") update = { $inc: { quantity: qty } };
  if (type === "OUT") {
    update = { $inc: { quantity: -qty } };
    condition.quantity = { $gte: qty };            // only if enough stock
  }
  if (type === "ADJUST") update = { $set: { quantity: qty } };

  // returns the product as it was BEFORE the change
  const old = await Product.findOneAndUpdate(condition, update);

  if (!old) {
    const product = await Product.findById(productId);
    if (!product) throw new AppError("Product not found", 404);
    throw new AppError(`Not enough stock. Only ${product.quantity} ${product.unit} left.`, 400);
  }

  const before = old.quantity;
  const after = type === "IN" ? before + qty : type === "OUT" ? before - qty : qty;

  const movement = await StockMovement.create({
    product: old._id, productName: old.name, type, quantity: qty,
    change: after - before, before, after, note, user: req.user._id,
  });
  await movement.populate("user", "name");

  res.status(201).json({ movement, product: { _id: old._id, quantity: after } });
};
```

We send back the new quantity too, so the frontend can update that product on screen without reloading everything.

### The history list

`GET /api/stock?product=<id>&type=OUT&from=2026-09-01&to=2026-09-30&page=1`

```js
export const getMovements = async (req, res) => {
  const { product, type, from, to } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 15;

  const filter = {};
  if (product) filter.product = product;
  if (type) filter.type = type;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59`);
  }

  const [items, total] = await Promise.all([
    StockMovement.find(filter).populate("user", "name").sort("-createdAt").skip((page - 1) * limit).limit(limit),
    StockMovement.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
};
```

Routes: both `GET /api/stock` and `POST /api/stock` are for **any logged-in user**. Staff need to record stock, that's their main job.

Movements are never edited or deleted. If someone makes a mistake, they fix it with another movement (for example an ADJUST with the note "fixing wrong entry"). That's how real books work.

**Commit:** `phase 5: stock movements`

---

## Phase 6: Dashboard numbers

**Goal:** one request that gives the dashboard everything it needs.

`GET /api/dashboard`

```js
export const getDashboard = async (req, res) => {
  const lowExpr = { $and: [{ $gt: ["$quantity", 0] }, { $lte: ["$quantity", "$reorderLevel"] }] };

  const [summary] = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalUnits: { $sum: "$quantity" },
        stockValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
        lowStock: { $sum: { $cond: [lowExpr, 1, 0] } },
        outOfStock: { $sum: { $cond: [{ $eq: ["$quantity", 0] }, 1, 0] } },
      },
    },
  ]);

  const byCategory = await Product.aggregate([
    { $group: { _id: "$category", value: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } },
    { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "cat" } },
    { $project: { _id: 0, name: { $ifNull: [{ $arrayElemAt: ["$cat.name", 0] }, "Other"] }, value: 1 } },
    { $sort: { value: -1 } },
  ]);

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const last7Days = await StockMovement.aggregate([
    { $match: { createdAt: { $gte: since }, type: { $in: ["IN", "OUT"] } } },
    {
      $group: {
        _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, type: "$type" },
        qty: { $sum: "$quantity" },
      },
    },
  ]);

  const lowStockItems = await Product.find({ $expr: { $lte: ["$quantity", "$reorderLevel"] } })
    .select("name sku quantity reorderLevel unit")
    .sort("quantity")
    .limit(6);

  const recent = await StockMovement.find().populate("user", "name").sort("-createdAt").limit(6);

  res.json({
    summary: summary || { totalProducts: 0, totalUnits: 0, stockValue: 0, lowStock: 0, outOfStock: 0 },
    byCategory,
    last7Days,
    lowStockItems,
    recent,
  });
};
```

What an **aggregate** is: a list of steps MongoDB runs one after another, like a factory line. `$group` = "put these together and add them up". `$lookup` = "go fetch the matching category". `$project` = "keep only these fields".

`timezone: "Asia/Kolkata"` makes sure a sale at 11pm counts on the right day for us, not on the UK date.

**Backend is done.** Test every route in Postman once as admin and once as a staff user. Staff should get 403 on anything admin-only.

**Commit:** `phase 6: dashboard api, backend complete`

---

# PART B: THE FRONTEND

## Phase 7: Set up the frontend

**Goal:** React app with routing, Redux, Tailwind and a ready-to-use Axios.

1. From the `inventory-management-system` folder (the frontend folder already exists, so create inside it):
   ```bash
   cd frontend
   npm create vite@latest . -- --template react
   npm install
   npm install @reduxjs/toolkit react-redux react-router-dom axios recharts react-hot-toast lucide-react
   npm install -D tailwindcss @tailwindcss/vite
   ```
   If Vite asks about the folder not being empty (because of `.gitkeep`), choose to ignore the files and continue.

2. `vite.config.js`:
   ```js
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";
   import tailwindcss from "@tailwindcss/vite";

   export default defineConfig({ plugins: [react(), tailwindcss()] });
   ```

3. Replace everything in `src/index.css` with:
   ```css
   @import "tailwindcss";
   ```
   Delete `App.css` and the Vite demo stuff.

4. `.env` in the frontend:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

5. `src/api/axios.js`. One Axios setup the whole app uses:
   ```js
   import axios from "axios";

   const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

   // attach the token to every request
   api.interceptors.request.use((config) => {
     const token = localStorage.getItem("token");
     if (token) config.headers.Authorization = `Bearer ${token}`;
     return config;
   });

   // if the token is bad or expired, log out and go to login
   api.interceptors.response.use(
     (res) => res,
     (err) => {
       if (err.response?.status === 401) {
         localStorage.removeItem("token");
         if (window.location.pathname !== "/login") window.location.href = "/login";
       }
       return Promise.reject(err);
     }
   );

   export const errMsg = (err) => err.response?.data?.message || err.message || "Something went wrong";
   export default api;
   ```
   An **interceptor** is like a security desk every request walks past. Going out: it sticks the token on. Coming back: if the server says "401, who are you?", it logs you out.

6. `src/utils/format.js`:
   ```js
   export const money = (n) =>
     new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

   export const date = (d) =>
     new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

   export const stockStatus = (p) =>
     p.quantity === 0 ? "out" : p.quantity <= p.reorderLevel ? "low" : "in";
   ```

**Commit:** `phase 7: frontend setup`

---

## Phase 8: Redux store and the slice pattern

**Goal:** understand one slice fully, then copy the pattern for the rest.

### How data flows (this is the same for every feature)

1. A page says `dispatch(fetchProducts({ page: 1 }))`.
2. The **thunk** (a function made with `createAsyncThunk`) calls the backend with Axios.
3. While waiting, Redux marks it `pending` → we show a spinner.
4. When the answer comes, it's `fulfilled` → we put the data in the store.
5. If it fails, it's `rejected` → we save the error message and show it.
6. Any component using `useSelector` sees the new data and re-draws.

### Example: `src/features/products/productSlice.js`

```js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { errMsg } from "../../api/axios";

export const fetchProducts = createAsyncThunk("products/fetch", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/products", { params });
    return data;
  } catch (err) {
    return rejectWithValue(errMsg(err));
  }
});

export const createProduct = createAsyncThunk("products/create", async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/products", body);
    return data;
  } catch (err) {
    return rejectWithValue(errMsg(err));
  }
});

export const updateProduct = createAsyncThunk("products/update", async ({ id, body }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/products/${id}`, body);
    return data;
  } catch (err) {
    return rejectWithValue(errMsg(err));
  }
});

export const deleteProduct = createAsyncThunk("products/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/products/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(errMsg(err));
  }
});

const productSlice = createSlice({
  name: "products",
  initialState: { items: [], total: 0, page: 1, pages: 1, loading: false, saving: false, error: null },
  reducers: {
    // called after a stock movement so the table shows the new quantity instantly
    setQuantity: (state, { payload }) => {
      const p = state.items.find((i) => i._id === payload._id);
      if (p) p.quantity = payload.quantity;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchProducts.fulfilled, (s, { payload }) => {
        s.loading = false;
        Object.assign(s, payload);          // items, total, page, pages
      })
      .addCase(fetchProducts.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })

      .addCase(createProduct.fulfilled, (s, { payload }) => { s.items.unshift(payload); s.total += 1; })
      .addCase(updateProduct.fulfilled, (s, { payload }) => {
        const i = s.items.findIndex((p) => p._id === payload._id);
        if (i !== -1) s.items[i] = payload;
      })
      .addCase(deleteProduct.fulfilled, (s, { payload }) => {
        s.items = s.items.filter((p) => p._id !== payload);
        s.total -= 1;
      })

      // one "saving" flag for create / update / delete, so buttons can be disabled
      .addMatcher((a) => /^products\/(create|update|delete)\/pending$/.test(a.type), (s) => { s.saving = true; })
      .addMatcher((a) => /^products\/(create|update|delete)\/(fulfilled|rejected)$/.test(a.type), (s) => { s.saving = false; });
  },
});

export const { setQuantity } = productSlice.actions;
export default productSlice.reducer;
```

In the page, when you need to know whether a save worked (to close a form and show a toast), use `.unwrap()`:

```js
try {
  await dispatch(createProduct(form)).unwrap();
  toast.success("Product added");
  closeModal();
} catch (msg) {
  toast.error(msg);
}
```

### The other slices (same pattern)

| Slice | Thunks | State |
|---|---|---|
| `authSlice` | `checkSetup`, `setupAdmin`, `login`, `fetchMe`, plus a normal `logout` reducer | `user`, `token`, `needsSetup`, `loading`, `error` |
| `categorySlice` | fetch, create, update, delete | `items`, `loading`, `saving`, `error` |
| `supplierSlice` | fetch, create, update, delete | same |
| `stockSlice` | `fetchMovements(params)`, `createMovement(body)` | `items`, `total`, `page`, `pages`, `loading`, `saving`, `error` |
| `dashboardSlice` | `fetchDashboard` | `data`, `loading`, `error` |
| `userSlice` | fetch, create, update | `items`, `loading`, `saving`, `error` |

**Auth slice specifics:**
- `initialState.token = localStorage.getItem("token")`, so a refresh keeps you logged in.
- On `login.fulfilled` and `setupAdmin.fulfilled`: save `token` to state **and** `localStorage`, save `user`.
- `logout` reducer: clear user, token and `localStorage`.
- `fetchMe` runs once when the app loads if a token exists, to get the user back after refresh.

**Stock slice specific:** after `createMovement` succeeds in the page, also call `dispatch(setQuantity(result.product))` so the products table updates without a reload.

### `src/app/store.js`

```js
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
```

Wrap the app in `main.jsx`:
```jsx
<Provider store={store}>
  <BrowserRouter>
    <App />
    <Toaster position="top-right" />
  </BrowserRouter>
</Provider>
```

**Commit:** `phase 8: redux store and slices`

---

## Phase 9: Routing, login and protected pages

**Goal:** you can't see anything inside the app unless logged in, and staff can't open admin pages.

### `src/components/ProtectedRoute.jsx`

```jsx
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import Spinner from "./Spinner";

export default function ProtectedRoute({ roles }) {
  const { user, token } = useSelector((s) => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <Spinner full />;                       // still loading "me"
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
```

### `src/App.jsx`

```jsx
export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);

  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [token, dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<Setup />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/stock" element={<Stock />} />
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

### Login page (UI)

- Full screen, light grey background. A white card in the middle, rounded corners, soft shadow.
- App name and a box icon at the top ("StockDesk" or whatever you like).
- Fields: **Email**, **Password** (with a show/hide eye icon).
- Button: **Sign in**. While waiting it says "Signing in..." and is disabled.
- Wrong details → red message under the form ("Wrong email or password").
- When the page opens, call `checkSetup`. If `needsSetup` is true, send the user to `/setup` instead.
- Already logged in? Send straight to `/`.

### Setup page (UI)

- Same card look. Title: "Create your admin account".
- Short line: "This is a fresh install. The account you create here will be the admin."
- Fields: Name, Email, Password, Confirm password (must match, checked on the frontend before sending).
- After success → logged in → go to dashboard.
- If setup is already done, redirect to `/login`.

**Commit:** `phase 9: routing and auth pages`

---

## Phase 10: The main layout

**Goal:** the frame every inside page sits in.

### Look

```
+-------------+-----------------------------------------------+
|  [box] Stock|  Products                       Rohan (Admin) v|  <- Topbar
|             +-----------------------------------------------+
|  Dashboard  |                                               |
|  Products   |                                               |
|  Stock      |            page content here                  |
|  Categories |            (<Outlet />)                       |
|  Suppliers  |                                               |
|  Users *    |                                               |
|             |                                               |
|  Logout     |                                               |
+-------------+-----------------------------------------------+
```

### Sidebar

- Dark (slate-900), white text, fixed on the left, 240px wide.
- Each link has an icon from lucide-react: `LayoutDashboard`, `Package`, `ArrowLeftRight`, `Tags`, `Truck`, `Users`.
- Use `NavLink` so the current page is highlighted (lighter background, left border in the brand colour).
- **Users** only shows if `user.role === "admin"`.
- **Logout** at the bottom: dispatch `logout`, go to `/login`.

### Topbar

- White bar with a thin bottom border.
- Page title on the left.
- On the right: the user's name and a small role badge (Admin in purple, Staff in grey).

### Mobile

- Under `md` screen size, the sidebar hides. A hamburger icon in the topbar opens it as a slide-in panel with a dark see-through backdrop. Tapping a link or the backdrop closes it.

### Small reusable components (build them now, you'll use them everywhere)

| Component | What it is |
|---|---|
| `Modal` | Dark backdrop + white box in the middle. Props: `open`, `title`, `onClose`, `children`. Closes on Esc and on backdrop click. |
| `ConfirmDialog` | A small Modal: "Delete Blue Pen? This can't be undone." with Cancel and a red Delete button. |
| `StockBadge` | Takes a product, uses `stockStatus()`. Green pill "In stock", orange "Low stock", red "Out of stock". |
| `Pagination` | "Showing 11-20 of 57" on the left, Prev / page numbers / Next on the right. Buttons disabled at the ends. |
| `Spinner` | A spinning circle. `full` prop makes it cover the whole screen. |
| `EmptyState` | Icon + a line like "No products yet" + an optional button ("Add your first product"). |

**Commit:** `phase 10: layout and shared components`

---

## Phase 11: Products page

**Goal:** the page people will use the most. Make it good.

### Top row

- Title "Products" and a small count ("57 products").
- Right side buttons: **Export CSV** (outline button) and **+ Add Product** (solid, admin only).

### Filter bar (one row, wraps on mobile)

- **Search box** with a magnifying glass icon, placeholder "Search by name or SKU".
- **Category** dropdown: "All categories" + every category.
- **Supplier** dropdown: "All suppliers" + every supplier.
- **Stock** dropdown: All / In stock / Low stock / Out of stock.
- **Sort** dropdown: Newest, Name A-Z, Name Z-A, Quantity low-high, Quantity high-low, Price low-high, Price high-low.

**How the filters work:**
- Keep them all in one state object: `{ search, category, supplier, stock, sort, page }`.
- Whenever it changes, `dispatch(fetchProducts(filters))`.
- Changing any filter resets `page` to 1.
- **Search waits a moment.** We don't want a server call on every key press. Wait 400ms after the user stops typing:

```js
const [searchText, setSearchText] = useState("");

useEffect(() => {
  const t = setTimeout(() => setFilters((f) => ({ ...f, search: searchText, page: 1 })), 400);
  return () => clearTimeout(t);
}, [searchText]);
```

- Show a small "Clear filters" link when any filter is active.

### The table

| Column | Shows |
|---|---|
| Product | Name in bold, SKU underneath in small grey text |
| Category | Category name |
| Supplier | Supplier name, or "—" |
| Qty | Quantity + unit, e.g. "24 pcs" |
| Cost / Price | Both, formatted as ₹ |
| Value | quantity × cost price |
| Status | `StockBadge` |
| Actions | Icon buttons: **Stock** (opens the stock movement modal for this product, everyone), **Edit** (admin), **Delete** (admin) |

- Rows with low stock get a very light orange background. Out of stock, light red.
- Table header is sticky, rows highlight on hover.
- On small screens, the table scrolls sideways inside its own box (the page itself doesn't).
- While loading, show 5 grey "skeleton" rows that gently pulse, instead of a blank table.
- If nothing matches: `EmptyState` "No products match your filters".
- `Pagination` below the table.

### Add / Edit product modal

Two-column form (one column on mobile):

| Field | Type | Rules (check on the frontend too) |
|---|---|---|
| Name | text | required |
| SKU | text | required, auto uppercase as you type |
| Category | dropdown | required |
| Supplier | dropdown | optional |
| Unit | dropdown | pcs, box, kg, g, litre, ml, pack, dozen |
| Cost price | number | 0 or more |
| Selling price | number | 0 or more. Show a small warning (not an error) if it's lower than cost price |
| Opening quantity | number | **only shown when adding**, not editing |
| Reorder level | number | 0 or more, default 10 |
| Description | textarea | optional |

- Same modal for add and edit. If you pass a product in, it's edit mode: title "Edit Product", fields pre-filled, button "Save changes".
- While saving: button disabled, text "Saving...".
- Success → toast "Product added" / "Product updated", close modal.
- Server error (like "sku already exists") → toast in red, modal stays open so they can fix it.
- In edit mode, show a small grey line under the form: "To change quantity, use Stock In / Out."

### Delete

- `ConfirmDialog` → on confirm, dispatch `deleteProduct` → toast "Product deleted".
- If that was the last item on the page, go back one page.

### Export CSV

The token must go with the request, so we download through Axios and then make the browser save it:

```js
const exportCsv = async () => {
  const res = await api.get("/products/export", { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
```

Load categories and suppliers once when this page opens (for the dropdowns), only if they're not already in the store.

**Commit:** `phase 11: products page`

---

## Phase 12: Categories and Suppliers pages

**Goal:** two simple management pages.

### Categories

- Grid of cards (3 across on desktop, 1 on mobile). Each card: name, description, and "12 products" in grey.
- Admin sees small Edit and Delete icons on each card.
- **+ Add Category** button opens a Modal with Name and Description.
- Trying to delete a category that has products → the server's message shows in a red toast ("Can't delete: 12 product(s) still use this category").
- Nice extra: clicking a card takes you to `/products?category=<id>` with that filter already applied. (Read it on the Products page with `useSearchParams`.)

### Suppliers

- Table: Name, Contact person, Phone, Email, Address, Actions.
- Phone is a `tel:` link and email is a `mailto:` link, so one tap calls or emails.
- Add / Edit in a Modal. Delete with confirm. Same "in use" rule.
- A search box that filters the list on the frontend (suppliers are usually few, no need for the server).

**Commit:** `phase 12: categories and suppliers pages`

---

## Phase 13: Stock page (in, out, adjust + history)

**Goal:** a fast screen for the person standing at the storeroom door.

### Top: three big action buttons

- **Stock In** (green, arrow-down-into-box icon)
- **Stock Out** (red, arrow-up-out icon)
- **Adjust** (blue, sliders icon)

Each opens the **Stock Movement modal** with that type already picked. The same modal also opens from the "Stock" button on a product row, with the product already picked.

### Stock Movement modal

- **Type**: three toggle buttons (In / Out / Adjust). The selected one is filled with its colour.
- **Product**: a search-as-you-type box. Typing calls `/products?search=...&limit=8` and shows a small list under it. Each suggestion shows name, SKU and current quantity.
- Once a product is picked, show a small info strip: "Current stock: **24 pcs** · Reorder at 10".
- **Quantity**: number box. For Adjust, the label changes to "Actual counted quantity".
- **Live preview** under it, so the user sees what will happen before saving:
  - In: "24 → **44**"
  - Out: "24 → **19**". If they type more than there is, the preview turns red: "Only 24 available" and the Save button is disabled.
  - Adjust: "24 → **21** (−3)"
- **Note**: text box. Placeholder changes by type: "Invoice no. / supplier" for In, "Order no. / reason" for Out. For Adjust it's **required** ("Why is it different? e.g. damaged, miscounted").
- Save → dispatch `createMovement` → `setQuantity` on products → toast "Stock updated: Blue Pen now 44 pcs" → close → refresh the history list.

The frontend check is just for comfort. The **server** is what really protects the stock from going negative (Phase 5).

### Below: Movement history

- Filters: Product (same search box), Type (All/In/Out/Adjust), From date, To date.
- Table columns: Date & time, Product, Type (coloured pill), Change (**+20** in green or **−5** in red), Before → After, Note, By (user name).
- Pagination, 15 per page.
- Empty state: "No stock movements yet. Record your first delivery with Stock In."

**Commit:** `phase 13: stock page`

---

## Phase 14: Dashboard

**Goal:** the first thing you see after login. One look tells you how the shop is doing.

Call `fetchDashboard` when the page opens. Show a skeleton while loading.

### Row 1: five stat cards

| Card | Value | Icon / colour |
|---|---|---|
| Total Products | `summary.totalProducts` | Package, blue |
| Units in Stock | `summary.totalUnits` | Layers, indigo |
| Stock Value | `money(summary.stockValue)` | IndianRupee, green |
| Low Stock | `summary.lowStock` | AlertTriangle, orange |
| Out of Stock | `summary.outOfStock` | XCircle, red |

White cards, rounded, small icon in a soft coloured circle, big number, small grey label. Clicking **Low Stock** goes to `/products?stock=low`, clicking **Out of Stock** goes to `/products?stock=out`.

### Row 2: two charts side by side (stacked on mobile)

**Stock In vs Out, last 7 days** (Recharts `BarChart`, green bars for In, red for Out).

The server only sends days that had movements. Fill in the missing days with 0 so the chart always shows 7 bars:

```js
const days = [...Array(7)].map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  const key = d.toLocaleDateString("en-CA");            // "2026-09-27"
  const find = (type) => data.last7Days.find((x) => x._id.day === key && x._id.type === type)?.qty || 0;
  return { day: d.toLocaleDateString("en-IN", { weekday: "short" }), In: find("IN"), Out: find("OUT") };
});
```

**Stock value by category** (Recharts `PieChart` as a donut, or a horizontal `BarChart`). Tooltip shows the ₹ value.

Wrap each chart in `ResponsiveContainer` so it resizes with the screen.

### Row 3: two lists side by side

- **Running low**: product name, "3 left / reorder at 10", and a small orange or red badge. Each row has a quick "Stock In" button that opens the movement modal for that product. If the list is empty, show a green tick: "All stocked up".
- **Recent activity**: "Rohan added 20 × Blue Pen · 2h ago", with a coloured dot per type. "View all" link to `/stock`.

**Commit:** `phase 14: dashboard`

---

## Phase 15: Users page (admin only)

**Goal:** the admin manages the team.

- Table: Name, Email, Role (pill), Status (Active green / Disabled grey), Joined date, Actions.
- **+ Add User** → Modal: Name, Email, Password, Role (Admin/Staff).
- **Edit** → same modal, password box says "Leave blank to keep current password".
- **Disable / Enable** toggle button in each row with a confirm.
- The admin's own row: role and disable controls are greyed out, with a small "(you)" next to the name.

A disabled user who tries to log in gets "Your account is disabled". If they were already logged in, their next request fails with 401 and they're sent to login (the `protect` guard checks `isActive` every time).

**Commit:** `phase 15: users page`

---

## Phase 16: Polish

**Goal:** the difference between "it works" and "it feels professional". Go through this list:

- [ ] Every button that saves something is disabled while saving and shows "Saving...".
- [ ] Every success shows a green toast. Every failure shows the server's real message in a red toast.
- [ ] Every list has a loading state (skeleton or spinner) and an empty state.
- [ ] Every delete asks "are you sure?" first.
- [ ] Forms check required fields on the frontend and show the error under the field in red.
- [ ] Number inputs don't accept negative values (`min="0"`).
- [ ] All money shows as ₹ with Indian commas (₹1,25,000).
- [ ] Dates look human ("27 Sep, 03:45 pm"), not "2026-09-27T10:15:00.000Z".
- [ ] Staff never see admin-only buttons (and even if they force it, the server says 403).
- [ ] 404 page: big "404", "This page doesn't exist", button "Back to dashboard".
- [ ] Browser tab title changes per page (`document.title = "Products · StockDesk"`).
- [ ] Works on a phone: sidebar becomes a drawer, tables scroll sideways, modals fit the screen.
- [ ] One consistent look: same button styles, same card style, same spacing, one brand colour (for example indigo-600).
- [ ] No `console.log` left in the code.

**Commit:** `phase 16: polish`

---

## Phase 17: Test it like a real user

Do this whole story from start, with a fresh empty database:

1. Open the app → you land on Setup → create the admin.
2. Add 3 categories (Stationery, Electronics, Grocery) and 2 suppliers.
3. Add 8 products. Give some an opening quantity, some zero.
4. Dashboard shows the right totals. Out-of-stock count matches the zero ones.
5. Stock In 50 of one product. Quantity goes up, history shows it, dashboard chart shows a green bar today.
6. Stock Out more than available → blocked with "Only X left".
7. Stock Out a normal amount → goes down. If it hits the reorder level, it turns orange everywhere.
8. Adjust one product with a note → history shows before, after and the difference.
9. Try to delete a category that has products → blocked with a clear message.
10. Search "pen", filter by category, filter "Low stock", sort by quantity, go to page 2. All together.
11. Export CSV and open it in Excel. Columns are correct.
12. As admin, create a staff user. Log out. Log in as staff.
13. As staff: no Users link, no Add/Edit/Delete product buttons, but Stock In/Out works.
14. Type `/users` in the URL as staff → sent back to dashboard.
15. Log back in as admin, disable the staff user. Staff can't log in any more.
16. Refresh the page on any screen → you stay logged in and on the same page.
17. Stop the backend and click around → you see error toasts, not a white screen.

If all 17 pass, your app is ready.

**Commit:** `phase 17: tested`

---

## Phase 18: Put it online

**Database: MongoDB Atlas**
1. Create a free cluster. Create a database user with a password.
2. Network Access → allow `0.0.0.0/0` (anyone, the password still protects it).
3. Copy the connection string, put the database name `inventory` in it.

**Backend: Render**
1. New Web Service → pick your GitHub repo and **your branch**.
2. Root directory: `inventory-management-system/backend`
3. Build command: `npm install` · Start command: `npm start`
4. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES`, `CLIENT_URL` (fill this in after the frontend is live).
5. Open `https://your-app.onrender.com/api/health` → `{"ok":true}`.

**Frontend: Vercel**
1. New project → same repo, your branch, root `inventory-management-system/frontend`.
2. Environment variable: `VITE_API_URL=https://your-app.onrender.com/api`
3. Add `vercel.json` in the frontend folder so refreshing on `/products` doesn't give a 404:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
   ```
4. Copy the Vercel URL, go back to Render, set `CLIENT_URL` to it, redeploy.

Note: Render's free plan falls asleep when nobody uses it. The first request after a while can take 30 to 50 seconds. That's normal.

**Commit:** `phase 18: deployed` and put both live links at the top of a `README.md`.

---

## Quick reference: every API route

| Method | URL | Who | What |
|---|---|---|---|
| GET | `/api/health` | public | server alive? |
| GET | `/api/auth/setup-status` | public | is this a fresh install? |
| POST | `/api/auth/setup` | public, once | create first admin |
| POST | `/api/auth/login` | public | log in |
| GET | `/api/auth/me` | logged in | who am I |
| GET / POST | `/api/users` | admin | list / create users |
| PATCH | `/api/users/:id` | admin | edit, change role, disable |
| GET / POST | `/api/categories` | logged in / admin | list / create |
| PUT / DELETE | `/api/categories/:id` | admin | edit / delete (blocked if in use) |
| GET / POST | `/api/suppliers` | logged in / admin | list / create |
| PUT / DELETE | `/api/suppliers/:id` | admin | edit / delete (blocked if in use) |
| GET | `/api/products` | logged in | list with search, filters, sort, pages |
| GET | `/api/products/export` | logged in | CSV download |
| GET | `/api/products/:id` | logged in | one product |
| POST | `/api/products` | admin | create (opening stock gets logged) |
| PUT | `/api/products/:id` | admin | edit (quantity ignored) |
| DELETE | `/api/products/:id` | admin | delete |
| GET | `/api/stock` | logged in | movement history with filters |
| POST | `/api/stock` | logged in | stock in / out / adjust |
| GET | `/api/dashboard` | logged in | all dashboard numbers |

## Want to go further? (bonus, only after everything above works)

- **Purchase orders:** create an order to a supplier, and when it arrives, one click turns it into Stock In for every item.
- **Barcode scanning:** use the phone camera to fill the SKU in the stock modal (`html5-qrcode` package).
- **Product images:** upload with `multer` and store on Cloudinary.
- **Email alert** to the admin when something hits low stock (`nodemailer`).
- **Dark mode** toggle with Tailwind's `dark:` classes.