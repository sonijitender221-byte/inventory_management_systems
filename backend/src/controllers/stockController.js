import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import AppError from "../utils/AppError.js";

export const createMovement = async (req, res) => {
  const { productId, type, note = "" } = req.body;
  const qty = Number(req.body.quantity);

  if (!["IN", "OUT", "ADJUST"].includes(type))
    throw new AppError("Type must be IN, OUT or ADJUST", 400);
  if (!Number.isInteger(qty) || qty < 0)
    throw new AppError("Quantity must be a whole number, 0 or more", 400);
  if (type !== "ADJUST" && qty === 0)
    throw new AppError("Quantity must be more than 0", 400);
  if (type === "ADJUST" && !note.trim())
    throw new AppError("Please give a reason for the adjustment", 400);

  const condition = { _id: productId };
  let update;
  if (type === "IN") update = { $inc: { quantity: qty } };
  if (type === "OUT") {
    update = { $inc: { quantity: -qty } };
    condition.quantity = { $gte: qty };
  }
  if (type === "ADJUST") update = { $set: { quantity: qty } };

  const old = await Product.findOneAndUpdate(condition, update);

  if (!old) {
    const product = await Product.findById(productId);
    if (!product) throw new AppError("Product not found", 404);
    throw new AppError(
      `Not enough stock. Only ${product.quantity} ${product.unit} left.`,
      400
    );
  }

  const before = old.quantity;
  const after = type === "IN" ? before + qty : type === "OUT" ? before - qty : qty;

  const movement = await StockMovement.create({
    product: old._id,
    productName: old.name,
    type,
    quantity: qty,
    change: after - before,
    before,
    after,
    note,
    user: req.user._id,
  });
  await movement.populate("user", "name");

  res.status(201).json({ movement, product: { _id: old._id, quantity: after } });
};

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
    StockMovement.find(filter)
      .populate("user", "name")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    StockMovement.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
};