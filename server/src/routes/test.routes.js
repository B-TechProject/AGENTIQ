// routes/test.routes.js
import express from "express";
import { runTests } from "../controllers/test.controller.js";
import protectRoute from "../middleware/auth.js";

const router = express.Router();

router.post("/run",protectRoute, runTests);

export default router;