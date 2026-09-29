import { Router } from "express";
import {
  setupStatus,
  setup,
  register,   // <-- YE MISSING THA
  login,
  me,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.get("/setup-status", setupStatus);
router.post("/setup", setup);
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);

export default router;