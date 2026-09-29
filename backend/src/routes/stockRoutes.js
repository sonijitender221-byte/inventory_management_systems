import { Router } from "express";
import { createMovement, getMovements } from "../controllers/stockController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);
router.route("/").get(getMovements).post(createMovement);

export default router;