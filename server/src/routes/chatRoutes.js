const express = require("express");
const {
  createConversation,
  getConversations,
  getMessages,
  sendMediaMessage,
  sendMessage,
} = require("../controllers/chatController");
const protect = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);
router.post("/conversations", createConversation);
router.get("/messages/:conversationId", getMessages);
router.post("/messages/:conversationId", sendMessage);
router.post("/messages/:conversationId/media", upload.single("media"), sendMediaMessage);

module.exports = router;
