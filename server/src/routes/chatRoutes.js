const express = require("express");
const {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
} = require("../controllers/chatController");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);
router.post("/conversations", createConversation);
router.get("/messages/:conversationId", getMessages);
router.post("/messages/:conversationId", sendMessage);

module.exports = router;
