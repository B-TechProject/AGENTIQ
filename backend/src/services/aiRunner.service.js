import { generateTests } from "./ai.service.js";
import { runFullAnalysis } from "./analyze.service.js";

export const runAITests = async (input, userId) => {
  const { url, method, description } = input;

  // 🔹 1. Generate tests using AI
  const tests = await generateTests({ url, method, description });

  if (!tests || tests.length === 0) {
    throw new Error("AI failed to generate test cases");
  }

  // 🔹 2. Run full analysis (functional tests only, NO security)
  const result = await runFullAnalysis(
    {
      tests,
      security: { enabled: false } // Disabled for TestRunner
    },
    userId
  );

  // 🔹 3. Format beautifully structured output for Postman viewer
  const formattedTests = result.functional.map(t => ({
      test_name: t.name,
      status: t.status === "pass" ? "PASS ✅" : "FAIL ❌",
      response_time_ms: t.responseTime,
      assertions: t.assertions,
      details: t.explanation || "No additional insights."
  }));

  return {
    summary: {
        total_tests: result.summary.totalTests,
        passed: result.summary.passed,
        failed: result.summary.failed
    },
    tests: formattedTests
  };
};