import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });

const userOut = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
});

export const setupStatus = async (req, res) => {
  const count = await User.countDocuments();
  res.json({ needsSetup: count === 0 });
};

export const setup = async (req, res) => {
  if (await User.countDocuments())
    throw new AppError("Setup already done. Ask your admin for an account.", 403);
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    throw new AppError("Name, email and password are required", 400);
  const user = await User.create({ name, email, password, role: "admin" });
  res.status(201).json({ token: makeToken(user._id), user: userOut(user) });
};


export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError("Email and password are required", 400);

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password)))
    throw new AppError("Wrong email or password", 400);
  if (!user.isActive) throw new AppError("Your account is disabled", 403);

  res.json({ token: makeToken(user._id), user: userOut(user) });
};

export const me = (req, res) => res.json({ user: userOut(req.user) });

export const register = async (req, res) => {
  const count = await User.countDocuments();
  const allowPublic = process.env.ALLOW_PUBLIC_REGISTRATION === "true";

  if (count > 0 && !allowPublic)
    throw new AppError(
      "Registration is closed. Ask your admin for an account.",
      403
    );

  const { name, email, password } = req.body;
  if (!name || !email || !password)
    throw new AppError("Name, email and password are required", 400);
  if (password.length < 6)
    throw new AppError("Password must be at least 6 characters", 400);

  const role = count === 0 ? "admin" : "staff";
  const user = await User.create({ name, email, password, role });
  res.status(201).json({ token: makeToken(user._id), user: userOut(user) });
};