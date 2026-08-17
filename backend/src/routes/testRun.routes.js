// routes/testRun.routes.js
import express from "express";
import { getAllRuns, getRunById } from "../controllers/testRun.controller.js";
import protectRoute from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/",protectRoute, getAllRuns);
router.get("/:id",protectRoute, getRunById);

export default router;