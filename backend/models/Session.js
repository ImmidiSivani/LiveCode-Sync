const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  code: { type: String, default: "" },
  language: { type: String, default: "" },
  users: [{type: String}],
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", sessionSchema);
