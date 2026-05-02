const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { populateConversation, userBelongsToConversation } = require("../controllers/chatController");
const { verifyToken } = require("../utils/token");

const onlineUsers = new Map();

const getOnlineUserIds = () => [...onlineUsers.keys()];

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication token required"));

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select("name email avatarColor bio lastSeen");
      if (!user) return next(new Error("User no longer exists"));

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error("Invalid socket token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    socket.join(userId);

    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit("presence:update", { onlineUsers: getOnlineUserIds() });
    socket.emit("presence:update", { onlineUsers: getOnlineUserIds() });

    const conversations = await Conversation.find({ participants: socket.user._id }).select("_id");
    conversations.forEach((conversation) => socket.join(conversation._id.toString()));

    socket.on("conversation:join", async (conversationId) => {
      const conversation = await Conversation.findById(conversationId).populate(
        "participants",
        "name email avatarColor bio lastSeen"
      );

      if (conversation && userBelongsToConversation(conversation, socket.user._id)) {
        socket.join(conversationId);
      }
    });

    socket.on("typing:start", ({ conversationId }) => {
      socket.to(conversationId).emit("typing:start", {
        conversationId,
        user: socket.user,
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(conversationId).emit("typing:stop", {
        conversationId,
        userId,
      });
    });

    socket.on("message:send", async ({ conversationId, text }, ack) => {
      try {
        if (!text?.trim()) {
          return ack?.({ ok: false, message: "Message text is required" });
        }

        const conversation = await Conversation.findById(conversationId).populate(
          "participants",
          "name email avatarColor bio lastSeen"
        );

        if (!conversation || !userBelongsToConversation(conversation, socket.user._id)) {
          return ack?.({ ok: false, message: "Conversation not found" });
        }

        const message = await Message.create({
          conversation: conversation._id,
          sender: socket.user._id,
          text,
          type: "text",
          readBy: [socket.user._id],
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        const populatedMessage = await Message.findById(message._id).populate("sender", "name email avatarColor");
        const populatedConversation = await populateConversation(Conversation.findById(conversation._id));

        io.to(conversationId).emit("message:new", {
          message: populatedMessage,
          conversation: populatedConversation,
        });

        return ack?.({ ok: true, message: populatedMessage });
      } catch (error) {
        return ack?.({ ok: false, message: "Could not send message" });
      }
    });

    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      io.emit("presence:update", { onlineUsers: getOnlineUserIds() });
    });
  });
};

module.exports = setupSocket;
