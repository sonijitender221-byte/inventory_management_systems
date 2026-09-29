import User from "../models/User.js";
import AppError from "../utils/AppError.js";

const userOut = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  isActive: u.isActive,
  createdAt: u.createdAt,
});

export const getUsers = async (req, res) => {
  const users = await User.find().sort("-createdAt");
  res.json(users.map(userOut));
};

export const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    throw new AppError("Name, email and password are required", 400);
  const user = await User.create({ name, email, password, role: role || "staff" });
  res.status(201).json(userOut(user));
};

export const updateUser = async (req, res) => {
  if (
    String(req.params.id) === String(req.user._id) &&
    (req.body.isActive === false || req.body.role === "staff")
  ) {
    throw new AppError("You can't disable or demote yourself", 400);
  }

  const user = await User.findById(req.params.id).select("+password");
  if (!user) throw new AppError("User not found", 404);

  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  if (req.body.role) user.role = req.body.role;
  if (typeof req.body.isActive === "boolean") user.isActive = req.body.isActive;
  if (req.body.password) user.password = req.body.password;

  await user.save();
  res.json(userOut(user));
};