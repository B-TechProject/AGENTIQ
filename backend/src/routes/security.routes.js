// routes/security.routes.js
import express from "express";
import { runSecurityScan } from "../controllers/security.controller.js";
import protectRoute from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/scan",protectRoute, runSecurityScan);

export default router;