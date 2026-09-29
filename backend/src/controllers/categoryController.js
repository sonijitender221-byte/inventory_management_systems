import Category from "../models/Category.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";

export const getCategories = async (req, res) => {
  const categories = await Category.aggregate([
    { $lookup: { from: "products", localField: "_id", foreignField: "category", as: "products" } },
    { $addFields: { productCount: { $size: "$products" } } },
    { $project: { products: 0 } },
    { $sort: { name: 1 } },
  ]);
  res.json(categories);
};

export const createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ ...category.toObject(), productCount: 0 });
};

export const updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new AppError("Category not found", 404);
  res.json(category);
};

export const deleteCategory = async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse)
    throw new AppError(`Can't delete: ${inUse} product(s) still use this category`, 400);
  const deleted = await Category.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError("Category not found", 404);
  res.json({ _id: req.params.id });
};