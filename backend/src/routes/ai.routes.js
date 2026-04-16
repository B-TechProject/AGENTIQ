import express from "express";
import {
  generateAITests,
  runAIAutoTests
} from "../controllers/ai.controller.js";


import protectRoute from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/generate", protectRoute, generateAITests);
router.post("/run", protectRoute, runAIAutoTests); // 🔥 NEW

export default router;