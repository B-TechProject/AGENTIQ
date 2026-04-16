// controllers/security.controller.js
import { testSQLi, testXSS, testAuth } from "../services/security.service.js";

export const runSecurityScan = async (req, res) => {
  const config = req.body;

  const results = [];

  const sqli = await testSQLi(config);
  results.push(sqli);

  const xss = await testXSS(config);
  results.push(xss);

  const auth = await testAuth(config);
  results.push(auth);

  return res.json({
    summary: {
      total: results.length,
      vulnerabilities: results.filter(r => r.vulnerable).length
    },
    results
  });
};