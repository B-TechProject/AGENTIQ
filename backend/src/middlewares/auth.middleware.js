import GUsers from "../models/googleUsers.js";
import Users from "../models/mongoUsers.js";
import jwt from "jsonwebtoken";

async function protectRoute(req, res, next) {
  try {
    // ✅ Support both cookie token and Authorization header
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    console.log("🔑 Token used for auth:", token);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    let decode;
    try {
      decode = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT Verification failed:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (!decode) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const userM = await Users.findOne({ email: decode.email }).select("-password");
    const userG = await GUsers.findOne({ email: decode.email }).select("-password");

    if (!userG && !userM) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userM ? userM : userG;

    req.user = user;
    req.userType = userM ? "User" : "GUser";

    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export default protectRoute;