// routes/security.routes.js
import express from "express";
import { runSecurityScan } from "../controllers/security.controller.js";
import protectRoute from "../middleware/auth.js";

const router = express.Router();

router.post("/scan",protectRoute, runSecurityScan);

export default router;