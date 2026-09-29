import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import AppError from "../utils/AppError.js";

const SORTS = [
  "name",
  "-name",
  "quantity",
  "-quantity",
  "sellingPrice",
  "-sellingPrice",
  "createdAt",
  "-createdAt",
];
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
  if (stock === "low")
    filter.$expr = { $and: [{ $gt: ["$quantity", 0] }, { $lte: ["$quantity", "$reorderLevel"] }] };
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

export const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name")
    .populate("supplier", "name");
  if (!product) throw new AppError("Product not found", 404);
  res.json(product);
};

export const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  if (product.quantity > 0) {
    await StockMovement.create({
      product: product._id,
      productName: product.name,
      type: "IN",
      quantity: product.quantity,
      change: product.quantity,
      before: 0,
      after: product.quantity,
      note: "Opening stock",
      user: req.user._id,
    });
  }
  await product.populate([
    { path: "category", select: "name" },
    { path: "supplier", select: "name" },
  ]);
  res.status(201).json(product);
};

export const updateProduct = async (req, res) => {
  const { quantity, ...changes } = req.body;
  const product = await Product.findByIdAndUpdate(req.params.id, changes, {
    new: true,
    runValidators: true,
  })
    .populate("category", "name")
    .populate("supplier", "name");
  if (!product) throw new AppError("Product not found", 404);
  res.json(product);
};

export const deleteProduct = async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError("Product not found", 404);
  res.json({ _id: req.params.id });
};

export const exportProducts = async (req, res) => {
  const products = await Product.find()
    .populate("category", "name")
    .populate("supplier", "name")
    .sort("name");
  const clean = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = [
    "Name", "SKU", "Category", "Supplier", "Unit",
    "Cost", "Price", "Quantity", "Reorder Level", "Stock Value",
  ];
  const rows = products.map((p) => [
    p.name, p.sku, p.category?.name, p.supplier?.name, p.unit,
    p.costPrice, p.sellingPrice, p.quantity, p.reorderLevel,
    p.quantity * p.costPrice,
  ]);
  const csv = [header, ...rows].map((r) => r.map(clean).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=products.csv");
  res.send(csv);
};