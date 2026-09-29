import { Router } from "express";
import { getUsers, createUser, updateUser } from "../controllers/userController.js";
import { protect, allow } from "../middleware/auth.js";

const router = Router();
router.use(protect, allow("admin"));
router.route("/").get(getUsers).post(createUser);
router.patch("/:id", updateUser);

export default router;