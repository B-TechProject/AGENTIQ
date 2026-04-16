// routes/analyze.routes.js
import express from "express";
import { runAnalysis } from "../controllers/analyze.controller.js";
import protectRoute from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/run",protectRoute, runAnalysis);

export default router;