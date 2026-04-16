import axios from "axios";
import { explainFailure } from "./aiExplain.service.js";

// 🔥 GLOBAL CONTROL (prevents multiple AI calls)
let explanationUsed = false;

export const runSingleTest = async (test) => {
  const start = Date.now();

  let response = null;
  let error = null;

  try {
    response = await axios({
      method: test.method,
      url: test.url,
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
        ...(test.headers || {}),
      },
      data: test.body || {},
      params: test.params || {},
      validateStatus: () => true, // don't throw on 4xx/5xx
      timeout: 10000,
    });
  } catch (err) {
    error = err;
  }

  const responseTime = Date.now() - start;

  // ❌ NETWORK ERROR (no response at all)
  if (error && !response) {
    return {
      name: test.name,
      status: "fail",
      responseTime,

      assertions: {
        check: "Network request",
        expected: "Successful response",
        actual: error?.message || "NETWORK ERROR",
        pass: false,
      },

      explanation: `Network Error: ${error?.message || "Unknown error"}`,
    };
  }

  // ✅ ACTUAL STATUS (always defined if response exists)
  const actualStatus = response?.status ?? "NO RESPONSE";

  // ✅ SUPPORT BOTH AI + NORMALIZED FORMAT
  const expectedStatus =
    test.assertions?.expected ??
    test.assertions?.status ??
    200;

  // ✅ FINAL PASS CHECK
  const pass = actualStatus === expectedStatus;

  let explanation = null;

  // 🔥 ONLY ONE AI EXPLANATION (optimization)
  if (!pass && !explanationUsed) {
    explanationUsed = true;

    try {
      explanation = await Promise.race([
        explainFailure(test, {
          status: actualStatus,
          responseTime,
          responseData: response?.data,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI timeout")), 5000)
        ),
      ]);
    } catch (err) {
      console.warn("AI explanation failed:", err.message);
      explanation = "Explanation unavailable (timeout or quota exceeded)";
    }
  }

  // ✅ FINAL RESPONSE (FRONTEND SAFE)
  return {
    name: test.name,
    status: pass ? "pass" : "fail",
    responseTime,

    assertions: {
      check: "Response status code",
      expected: expectedStatus,
      actual: actualStatus,
      pass,
    },

    explanation,
  };
};