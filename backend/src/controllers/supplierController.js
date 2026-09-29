import Supplier from "../models/Supplier.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";

export const getSuppliers = async (req, res) => {
  const suppliers = await Supplier.find().sort("name");
  res.json(suppliers);
};

export const createSupplier = async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json(supplier);
};

export const updateSupplier = async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!supplier) throw new AppError("Supplier not found", 404);
  res.json(supplier);
};

export const deleteSupplier = async (req, res) => {
  const inUse = await Product.countDocuments({ supplier: req.params.id });
  if (inUse)
    throw new AppError(`Can't delete: ${inUse} product(s) still use this supplier`, 400);
  const deleted = await Supplier.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError("Supplier not found", 404);
  res.json({ _id: req.params.id });
};