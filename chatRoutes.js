// routes/chatRoutes.js
const express = require("express");
const GroupMessage = require("../models/GroupMessage");

const router = express.Router();

module.exports = (io) => {
  // Send message (stores in MongoDB)
  router.post("/sendMessage", async (req, res) => {
    const { from_user, room, message } = req.body;

    // Basic validation
    if (!from_user || !room || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const newMsg = new GroupMessage({ from_user, room, message });
      await newMsg.save();

      // Realtime emit to the room
      io.to(room).emit("newMessage", {
        from_user,
        message,
        room,
        date_sent: newMsg.date_sent,
      });

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: "Error sending message" });
    }
  });

  // Load message history for a room
  router.get("/messages/:room", async (req, res) => {
    try {
      const messages = await GroupMessage.find({ room: req.params.room }).sort({
        date_sent: 1,
      });
      res.json(messages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error fetching messages" });
    }
  });

  return router;
};
