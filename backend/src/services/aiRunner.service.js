import { generateTests } from "./ai.service.js";
import { runFullAnalysis } from "./analyze.service.js";

export const runAITests = async (input, userId) => {
  const { url, method, description } = input;

  // 🔹 1. Generate tests using AI
  const tests = await generateTests({ url, method, description });

  if (!tests || tests.length === 0) {
    throw new Error("AI failed to generate test cases");
  }

  // 🔹 2. Run full analysis (test + security + save to DB)
  const result = await runFullAnalysis(
    {
      tests,
      security: { enabled: true }
    },
    userId
  );

  return {
    generatedTests: tests,
    result
  };
};