import axios from "axios";

export const generateTests = async ({ url, method, description }) => {
  try {
    console.log(
      "API Key starts with:",
      process.env.GEMINI_API_KEY_2?.substring(0, 10)
    );

    // 🔥 FINAL PROFESSIONAL PROMPT
    const prompt = `
You are a senior QA engineer specialized in API testing.

Generate API test cases.

API:
- URL: ${url}
- Method: ${method}

Description:
${description}

IMPORTANT RULES:
- Return ONLY JSON array
- NO explanation
- NO markdown
- EXACTLY 3 test cases:
  1. Valid request
  2. Invalid request
  3. Edge case

- Each test must include:
  name, method, url, body, assertions

- Assertions must include:
  status

- For GET requests:
  - DO NOT include body
  - Use empty body {}

Example:
[
  {
    "name": "Valid request",
    "method": "${method}",
    "url": "${url}",
    "body": {},
    "assertions": { "status": 200 }
  },
  {
    "name": "Invalid request",
    "method": "${method}",
    "url": "${url}",
    "body": {},
    "assertions": { "status": 400 }
  },
  {
    "name": "Edge case",
    "method": "${method}",
    "url": "${url}",
    "body": {},
    "assertions": { "status": 400 }
  }
]


IMPORTANT:

- Each test MUST be different
- Do NOT repeat same request

- For GET APIs:
  - Use query parameters for variation
  - Example:
    ?userId=1
    ?invalidParam=xyz

- Invalid test MUST actually simulate failure
  (e.g., wrong query param, invalid endpoint)

- Edge case MUST be meaningful
  (e.g., empty query, large values)

- Avoid words like "simulated"
`;

    // 🚀 GEMINI 2.5 FLASH API CALL
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY_2}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      }
    );

    // 🔍 Extract raw response
    const raw =
      response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!raw) {
      throw new Error("Empty AI response");
    }

    console.log("RAW AI RESPONSE:\n", raw);

    // 🔥 STEP 1: CLEAN
    let cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // 🔥 STEP 2: EXTRACT JSON ARRAY
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");

    if (start === -1 || end === -1) {
      throw new Error("No JSON array found in AI response");
    }

    cleaned = cleaned.substring(start, end + 1);

    // 🔥 STEP 3: PARSE
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("❌ JSON Parse Failed:", cleaned);
      throw new Error("Invalid JSON from AI");
    }

    // 🔥 STEP 4: VALIDATE STRUCTURE
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("AI returned empty or invalid test cases");
    }

    // 🔥 STEP 5: NORMALIZE + FIX LOGIC
    const normalized = parsed.map((test, index) => {
        let fixedMethod = test.method || method;
        let fixedBody = test.body || {};
        let fixedStatus = test.assertions?.status || 200;
        let fixedUrl = test.url || url;
        let params = test.params || {};
      
        // 🔥 AUTO-CONVERT QUERY PARAMS FROM URL
        if (fixedUrl.includes("?")) {
          const [baseUrl, queryString] = fixedUrl.split("?");
      
          params = Object.fromEntries(
            new URLSearchParams(queryString)
          );
      
          fixedUrl = baseUrl;
        }
      
        // ✅ FIX: GET should not have body
        if (fixedMethod === "GET") {
          fixedBody = {};
        }
      
        // ✅ FIX: GET should not expect 400 incorrectly
        if (fixedMethod === "GET" && fixedStatus === 400) {
          fixedStatus = 200;
        }
      
        return {
          name: test.name || `Test Case ${index + 1}`,
          description: test.name || `Test Case ${index + 1}`, // ✅ ADD THIS
          method: fixedMethod,
          url: fixedUrl,
          body: fixedBody,
          params,
        
          assertions: {
            check: "Response status code",
            expected: fixedStatus,
            actual: null,
            pass: false
          }
        };
      });

    return normalized;

  } catch (error) {
    console.error(
      "🔥 LLM ERROR:",
      error.response?.data || error.message
    );

    // 🛑 SAFE FALLBACK
    return [
      {
        name: "Fallback Valid Request",
        description: "Fallback Valid Request",
        method,
        url,
        body: {},
        assertions: {
          check: "Response status code",
          expected: 200,
          actual: null,
          pass: false
        }
      },
      {
        name: "Fallback Invalid Request",
        description: "Fallback Valid Request",
        method,
        url,
        body: {},
        assertions: {
          check: "Response status code",
          expected: 400,
          actual: null,
          pass: false
        }
      },
      {
        name: "Fallback Edge Case",
        description: "Fallback Valid Request",
        method,
        url,
        body: {},
        assertions: {
          check: "Response status code",
          expected: 422,
          actual: null,
          pass: false
        }
      }
    ];
  }
};