const User = require("../models/User");

const listUsers = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const filter = { _id: { $ne: req.user._id } };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("name email avatarColor bio lastSeen")
      .sort({ name: 1 })
      .limit(30);

    return res.json({ users });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listUsers };
