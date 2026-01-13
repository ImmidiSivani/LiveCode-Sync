const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const { verifyToken } = require("../middlewares/verifyToken.js");

const router = express.Router();
const SECRET = process.env.JWT_SECRET; // (use env var in production)

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    res.json({ message: "User created", user });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    //const user = await User.findOne({ username });
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "1h" });
    //res.json({ message: "Login successful", token });
    return res.status(200).json({ message: "Login successful", token, user: { id: user._id } });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});
router.options("/profile",  (req, res) => {
    // This route handles the OPTIONS preflight request.
    // It is just a confirmation that the server allows the GET request.
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(204); // Sends a 204 No Content response.
});
// Add this temporary debug route
router.get("/debug-profile", verifyToken, (req, res) => {
    console.log("🔍 DEBUG PROFILE - req.user:", req.user);
    res.json({ 
        message: "Debug route working",
        userFromToken: req.user,
        timestamp: new Date().toISOString()
    });
});

router.get("/profile", verifyToken, async (req, res) => {
    try {
        console.log("👤 PROFILE ROUTE - User ID:", req.user.id);
        
        const user = await User.findById(req.user.id).select("-password");
        console.log("📊 User found in DB:", user ? "Yes" : "No");
        
        if (!user) {
            console.log("❌ User not found in database");
            return res.status(404).json({ message: "User not found" });
        }
        
        console.log("✅ Sending user data:", { 
            username: user.username, 
            email: user.email 
        });
        
        // Return user data - MAKE SURE THIS STRUCTURE MATCHES FRONTEND
        return res.json({
            username: user.username,
            email: user.email
        });
        
    } catch (error) {
        console.error("💥 Profile route error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;