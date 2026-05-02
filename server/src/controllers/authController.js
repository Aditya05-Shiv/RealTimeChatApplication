const User = require("../models/User");
const { signToken } = require("../utils/token");

const avatarColors = ["#2563eb", "#0f766e", "#7c3aed", "#dc2626", "#c2410c", "#0891b2"];

const createSession = (user) => ({
  user: user.toJSON(),
  token: signToken(user._id),
});

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
    });

    return res.status(201).json(createSession(user));
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    user.lastSeen = new Date();
    await user.save();

    return res.json(createSession(user));
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res) => {
  return res.json({ user: req.user });
};

module.exports = { register, login, me };
