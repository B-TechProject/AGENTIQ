
import express from "express";
import { sendRequest } from "../controllers/request.controller.js";
import { validateRequest } from "../middleware/validateRequest.js";
import protectRoute from "../middleware/auth.js";

const router = express.Router();

router.post("/send", validateRequest,protectRoute, sendRequest);

// router.post("/send", sendRequest);

export default router;