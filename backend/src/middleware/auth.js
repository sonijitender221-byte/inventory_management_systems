import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

export const protect = async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw new AppError("Please log in", 401);

  let decoded;
  try {
    decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    throw new AppError("Session expired, please log in again", 401);
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new AppError("Account not found or disabled", 401);

  req.user = user;
  next();
};

export const allow = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    throw new AppError("You don't have permission to do this", 403);
  next();
};