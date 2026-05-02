const express = require("express");
const { listUsers } = require("../controllers/userController");
const protect = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, listUsers);

module.exports = router;
