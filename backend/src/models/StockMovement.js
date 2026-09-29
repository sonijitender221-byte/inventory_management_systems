import mongoose from "mongoose";

const movementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    type: { type: String, enum: ["IN", "OUT", "ADJUST"], required: true },
    quantity: { type: Number, required: true, min: 0 },
    change: { type: Number, required: true },
    before: { type: Number, required: true },
    after: { type: Number, required: true },
    note: { type: String, trim: true, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("StockMovement", movementSchema);