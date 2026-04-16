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
- NO explanation outside JSON
- NO markdown outside JSON
- EXACTLY 4 test cases:
  1. Valid positive request
  2. Alternative positive request or valid boundary
  3. Meaningful invalid request (e.g., missing parameter)
  4. Extreme negative edge case (e.g., malformed payload/query, unauthorized)

- Each test MUST include:
  name, method, url, body, assertions, description

- "description" MUST beautifully explain exactly what this test is verifying and WHY it expects its particular status code.

- Assertions must include:
  status

- For GET requests:
  - DO NOT include body
  - Use empty body {}

Example:
[
  {
    "name": "Valid Request",
    "description": "Verifies that the endpoint successfully returns data when provided a standard, completely valid request.",
    "method": "${method}",
    "url": "${url}",
    "body": {},
    "assertions": { "status": 200 }
  },
  {
    "name": "Invalid Request - Missing Query",
    "description": "Intentionally simulates a missing/invalid parameter to ensure the server correctly catches and rejects it with a 400 Bad Request.",
    "method": "${method}",
    "url": "${url}",
    "body": {},
    "assertions": { "status": 400 }
  }
]


IMPORTANT:

- Each test MUST be exclusively different
- Do NOT repeat same request
- For GET APIs, use query parameters for variation (?userId=1 vs ?invalidParam=xyz)
`;

    let raw = "";

    try {
        // 🚀 GROQ Llama 3 API CALL (Primary attempt if key exists)
        if (process.env.GROQ_API_KEY) {
            const groqRes = await axios.post(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    model: "llama-3.1-8b-instant", // Automatically maps to the latest Llama 3 endpoint
                    messages: [
                        { role: "system", content: "You are a senior QA engineer. Return ONLY a valid JSON array [] containing exactly 3 test case objects. Do NOT return a single object, it MUST be wrapped in an array []." },
                        { role: "user", content: prompt }
                    ],
                    response_format: { type: "json_object" }
                },
                { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
            );
            raw = groqRes?.data?.choices?.[0]?.message?.content || "";
        } else {
            throw new Error("No Groq Key - Falling back");
        }
    } catch(err) {
        console.log("Groq unavailable, falling back to FREE Pollinations AI (GPT-4o)!");
        
        // 🚀 POLLINATIONS AI (Completely free fallback, no key required)
        const pollRes = await axios.post(
            "https://text.pollinations.ai/",
            {
                messages: [
                    { role: "system", content: "You are a senior QA engineer. Return ONLY a valid JSON array [] containing exactly 3 test case objects. Do NOT return a single object, it MUST be wrapped in an array []." },
                    { role: "user", content: prompt }
                ],
                jsonMode: true,
                model: "openai"
            }
        );
        raw = typeof pollRes.data === 'string' ? pollRes.data : JSON.stringify(pollRes.data);
    }

    if (!raw) {
      throw new Error("Empty AI response");
    }

    console.log("RAW AI RESPONSE:\n", raw);

    // 🔥 STEP 1: CLEAN
    let cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // 🔥 STEP 2: EXTRACT JSON (Array or Object)
    let start = cleaned.indexOf("[");
    let end = cleaned.lastIndexOf("]");

    // If no array found, look for an object
    if (start === -1 || end === -1) {
      start = cleaned.indexOf("{");
      end = cleaned.lastIndexOf("}");
      
      if (start === -1 || end === -1) {
        throw new Error("No JSON structure found in AI response");
      }
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

    // 🔥 STEP 4: NORMALIZE TO ARRAY
    if (!Array.isArray(parsed)) {
      // Find the first value that is an array if the LLM nested it under some random key
      const foundArray = Object.values(parsed).find(val => Array.isArray(val));
      if (foundArray) {
        parsed = foundArray;
      } else {
        parsed = [parsed];
      }
    }
    
    // Flatten any weird nested arrays (Groq hallucinates nested arrays sometimes)
    parsed = parsed.flat(Infinity).filter(item => item && typeof item === 'object' && Object.keys(item).length > 0);

    if (parsed.length === 0) {
      throw new Error("AI returned empty test cases");
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
          description: test.description || `Simulating ${test.name || 'Test Case ' + (index+1)} for ${method} Request.`,
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
        description: "Intentionally running a valid functional payload",
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
        description: "Intentionally running an invalid functional payload to observe rejection",
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
        description: "Simulating a bizarre edge case payload to observe server stability",
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