// backend/models/Note.js
const mongoose = require("mongoose");
const noteSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String, required: true },
    action: { type: String, required: true },
    message: { type: String },
    codeContent: { type: String },
    timestamp: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Note", noteSchema);