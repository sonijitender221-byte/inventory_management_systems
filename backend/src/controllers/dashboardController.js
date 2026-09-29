import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";

export const getDashboard = async (req, res) => {
  const lowExpr = {
    $and: [{ $gt: ["$quantity", 0] }, { $lte: ["$quantity", "$reorderLevel"] }],
  };

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
    {
      $project: {
        _id: 0,
        name: { $ifNull: [{ $arrayElemAt: ["$cat.name", 0] }, "Other"] },
        value: 1,
      },
    },
    { $sort: { value: -1 } },
  ]);

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const last7Days = await StockMovement.aggregate([
    { $match: { createdAt: { $gte: since }, type: { $in: ["IN", "OUT"] } } },
    {
      $group: {
        _id: {
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },
          type: "$type",
        },
        qty: { $sum: "$quantity" },
      },
    },
  ]);

  const lowStockItems = await Product.find({
    $expr: { $lte: ["$quantity", "$reorderLevel"] },
  })
    .select("name sku quantity reorderLevel unit")
    .sort("quantity")
    .limit(6);

  const recent = await StockMovement.find()
    .populate("user", "name")
    .sort("-createdAt")
    .limit(6);

  res.json({
    summary:
      summary || {
        totalProducts: 0,
        totalUnits: 0,
        stockValue: 0,
        lowStock: 0,
        outOfStock: 0,
      },
    byCategory,
    last7Days,
    lowStockItems,
    recent,
  });
};