import { Router } from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  exportProducts,
} from "../controllers/productController.js";
import { protect, allow } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/export", exportProducts);
router.route("/").get(getProducts).post(allow("admin"), createProduct);
router
  .route("/:id")
  .get(getProduct)
  .put(allow("admin"), updateProduct)
  .delete(allow("admin"), deleteProduct);

export default router;