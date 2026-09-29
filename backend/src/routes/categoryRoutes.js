import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, allow } from "../middleware/auth.js";

const router = Router();
router.use(protect);
router.route("/").get(getCategories).post(allow("admin"), createCategory);
router
  .route("/:id")
  .put(allow("admin"), updateCategory)
  .delete(allow("admin"), deleteCategory);

export default router;