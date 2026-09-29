import { Router } from "express";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { protect, allow } from "../middleware/auth.js";

const router = Router();
router.use(protect);
router.route("/").get(getSuppliers).post(allow("admin"), createSupplier);
router
  .route("/:id")
  .put(allow("admin"), updateSupplier)
  .delete(allow("admin"), deleteSupplier);

export default router;