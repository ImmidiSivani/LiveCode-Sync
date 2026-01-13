const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "fallback_secret_for_development"; // ADD FALLBACK

const verifyToken = (req, res, next) => {
  console.log("🔐 VERIFY TOKEN MIDDLEWARE TRIGGERED");
  
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Token present:", !!token);
  
  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({ message: "No token" });
  }

  try {
    console.log("🔍 Verifying token...");
    const decoded = jwt.verify(token, SECRET);
    console.log("✅ Token verified. User ID:", decoded.id);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.log("❌ Token verification failed:", error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(403).json({ message: 'Token verification failed' });
  }
};

module.exports = { verifyToken };