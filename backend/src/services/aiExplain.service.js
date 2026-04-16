import axios from "axios";

export const explainFailure = async (test, result) => {
  try {
    // 1. Ensure this key matches your .env file EXACTLY (e.g., NEW_GEMINI_KEY or GEMINI_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY_2; 

    // 2. Use the STABLE v1 endpoint and 1.5-flash model
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
      You are an API expert. A test failed. 
      Test: ${test.name} (${test.method} ${test.url})
      Expected Status: ${test.assertions?.status}
      Actual Status: ${result.status}
      
      Explain why it failed in 2 sentences. No markdown.
    `;

    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) return "AI responded but gave no text content.";

    return aiText.replace(/[\r\n]+/g, " ").trim();

  } catch (err) {
    // This will help you see EXACTLY why the AI is failing in your terminal
    console.error("AI SERVICE ERROR:", err.response?.data || err.message);
    return "AI explanation failed: " + (err.response?.data?.error?.message || err.message);
  }
};