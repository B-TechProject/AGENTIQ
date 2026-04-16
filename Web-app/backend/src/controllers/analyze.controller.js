// controllers/analyze.controller.js
import { runFullAnalysis } from "../services/analyze.service.js";

export const runAnalysis = async (req, res) => {
  try {
    const userId = req.user?.id; // from auth middleware

    const result = await runFullAnalysis(req.body, userId);

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};