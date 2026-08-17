import { GeneratedTest, RunData, SecurityResult } from '@/services/api'

const AI_ENDPOINT = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

async function callAI(prompt: string): Promise<string> {
  const res = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  return data.content.map((c: { type: string; text?: string }) => c.text ?? '').join('')
}

function cleanJSON(raw: string): string {
  return raw.replace(/```json|```/g, '').trim()
}

export async function aiGenerateTests(
  url: string,
  method: string,
  description: string
): Promise<GeneratedTest[]> {
  const prompt = `Generate 5 realistic API test cases for this endpoint.
URL: ${url}
Method: ${method}
Description: ${description}

Respond ONLY with a JSON array, no markdown, no preamble:
[{"name":"string","description":"string","assertion":"string","type":"functional|security|edge"}]`

  const raw = await callAI(prompt)
  return JSON.parse(cleanJSON(raw))
}

export async function aiRunTests(
  url: string,
  method: string,
  description: string
): Promise<RunData> {
  const prompt = `Simulate realistic API test results for: ${method} ${url}
Description: ${description}

Respond ONLY with JSON (no markdown, no preamble):
{
  "generatedTests": [{"name":"string","description":"string","assertion":"string","type":"functional"}],
  "result": {
    "summary": {"totalTests":5,"passed":4,"failed":1,"vulnerabilities":1},
    "functional": [{"name":"string","status":"pass|fail","responseTime":200,"assertions":"expected vs actual","explanation":"only if fail"}],
    "security": [{"name":"SQL Injection","vulnerable":false,"reason":"string"},{"name":"XSS Reflected","vulnerable":true,"reason":"string"},{"name":"Broken Auth","vulnerable":false,"reason":"string"}]
  }
}`

  const raw = await callAI(prompt)
  return JSON.parse(cleanJSON(raw))
}

export async function aiSecurityScan(url: string): Promise<{
  vulnerabilities: (SecurityResult & { severity: string })[]
  score: number
  endpointsScanned: number
}> {
  const prompt = `Simulate a realistic security scan for API: ${url}

Respond ONLY with JSON (no markdown):
{
  "vulnerabilities": [
    {"name":"SQL Injection","vulnerable":false,"severity":"high","reason":"string"},
    {"name":"XSS Reflected","vulnerable":true,"severity":"medium","reason":"string"},
    {"name":"Broken Authentication","vulnerable":false,"severity":"critical","reason":"string"},
    {"name":"IDOR","vulnerable":false,"severity":"high","reason":"string"},
    {"name":"Rate Limiting","vulnerable":true,"severity":"low","reason":"string"}
  ],
  "score": 78,
  "endpointsScanned": 7
}`

  const raw = await callAI(prompt)
  return JSON.parse(cleanJSON(raw))
}
