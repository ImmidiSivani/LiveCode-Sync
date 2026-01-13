const express = require("express");
const Session = require("../models/Session.js");
const { verifyToken } = require("../middlewares/verifyToken.js");

const router = express.Router();

// Save or update session
router.post("/save", verifyToken, async (req, res) => {
  try {
    const { sessionId, code } = req.body;
    await Session.findOneAndUpdate(
      { sessionId },
      { code, lastUpdated: Date.now() },
      { upsert: true }
    );
    res.json({ message: "Session saved" });
  } catch (error) {
    res.status(500).json({ message: "Error saving session", error: error.message });
  }
});

// Load session
router.get("/:sessionId", verifyToken, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    res.json(session || {});
  } catch (error) {
    res.status(500).json({ message: "Error loading session", error: error.message });
  }
});



module.exports = router;