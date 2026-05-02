const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { uploadToCloudinary } = require("../utils/media");

const populateConversation = (query) =>
  query
    .populate("participants", "name email avatarColor bio lastSeen")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "name email avatarColor" },
    });

const userBelongsToConversation = (conversation, userId) => {
  return conversation.participants.some((participant) => participant._id.toString() === userId.toString());
};

const getConversations = async (req, res, next) => {
  try {
    const conversations = await populateConversation(
      Conversation.find({ participants: req.user._id }).sort({ updatedAt: -1 })
    );

    return res.json({ conversations });
  } catch (error) {
    return next(error);
  }
};

const createConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;

    if (!participantId || participantId === req.user._id.toString()) {
      return res.status(400).json({ message: "Choose another user to start a chat" });
    }

    const existing = await populateConversation(
      Conversation.findOne({
        participants: { $all: [req.user._id, participantId], $size: 2 },
      })
    );

    if (existing) {
      return res.json({ conversation: existing });
    }

    const conversation = await Conversation.create({
      participants: [req.user._id, participantId],
    });

    const populated = await populateConversation(Conversation.findById(conversation._id));
    return res.status(201).json({ conversation: populated });
  } catch (error) {
    return next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId).populate(
      "participants",
      "name email avatarColor bio lastSeen"
    );

    if (!conversation || !userBelongsToConversation(conversation, req.user._id)) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate("sender", "name email avatarColor")
      .sort({ createdAt: 1 })
      .limit(100);

    return res.json({ messages, conversation });
  } catch (error) {
    return next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const conversation = await Conversation.findById(req.params.conversationId).populate(
      "participants",
      "name email avatarColor bio lastSeen"
    );

    if (!conversation || !userBelongsToConversation(conversation, req.user._id)) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text,
      readBy: [req.user._id],
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate("sender", "name email avatarColor");
    const populatedConversation = await populateConversation(Conversation.findById(conversation._id));
    const io = req.app.get("io");

    if (io) {
      io.to(conversation._id.toString()).emit("message:new", {
        message: populatedMessage,
        conversation: populatedConversation,
      });
    }

    return res.status(201).json({ message: populatedMessage, conversation: populatedConversation });
  } catch (error) {
    return next(error);
  }
};

const sendMediaMessage = async (req, res, next) => {
  try {
    const { text = "" } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Choose an image or video to upload" });
    }

    const conversation = await Conversation.findById(req.params.conversationId).populate(
      "participants",
      "name email avatarColor bio lastSeen"
    );

    if (!conversation || !userBelongsToConversation(conversation, req.user._id)) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const uploaded = await uploadToCloudinary(req.file);
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text,
      type: uploaded.type,
      media: {
        url: uploaded.url,
        publicId: uploaded.publicId,
        originalName: uploaded.originalName,
        mimeType: req.file.mimetype,
        size: uploaded.bytes,
      },
      readBy: [req.user._id],
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate("sender", "name email avatarColor");
    const populatedConversation = await populateConversation(Conversation.findById(conversation._id));
    const io = req.app.get("io");

    if (io) {
      io.to(conversation._id.toString()).emit("message:new", {
        message: populatedMessage,
        conversation: populatedConversation,
      });
    }

    return res.status(201).json({ message: populatedMessage, conversation: populatedConversation });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  sendMediaMessage,
  userBelongsToConversation,
  populateConversation,
};
