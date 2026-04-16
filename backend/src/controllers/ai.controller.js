// controllers/ai.controller.js
import { generateTests } from "../services/ai.service.js";
import { runAITests } from "../services/aiRunner.service.js";

export const generateAITests = async (req, res) => {
  try {
    const { url, method, description } = req.body;

    if (!url || !method || !description) {
      return res.status(400).json({
        error: "url, method, description required"
      });
    }

    const tests = await generateTests({ url, method, description });

    return res.json({
      success: true,
      tests
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


export const runAIAutoTests = async (req, res) => {
    try {
      const { url, method, description } = req.body;
  
      if (!url || !method || !description) {
        return res.status(400).json({
          success: false,
          error: "url, method, description required"
        });
      }
  
      const userId = req.user?.id;
  
      const data = await runAITests(
        { url, method, description },
        userId
      );
  
      return res.json({
        success: true,
        data
      });
  
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };