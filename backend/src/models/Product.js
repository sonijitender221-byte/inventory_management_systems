import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, trim: true, default: "" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Pick a category"],
    },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    unit: {
      type: String,
      enum: ["pcs", "box", "kg", "g", "litre", "ml", "pack", "dozen"],
      default: "pcs",
    },
    costPrice: { type: Number, required: true, min: [0, "Cost price can't be negative"] },
    sellingPrice: { type: Number, required: true, min: [0, "Selling price can't be negative"] },
    quantity: { type: Number, default: 0, min: [0, "Quantity can't be negative"] },
    reorderLevel: { type: Number, default: 10, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);