// REQUEST FORMAT 
// {
//   "tests": [
//     {
//       "name": "Get Posts",
//       "method": "GET",
//       "url": "https://jsonplaceholder.typicode.com/posts/1",
//       "assertions": {
//         "status": 200,
//         "responseTimeLessThan": 500
//       }
//     }
//   ],
//   "security": {
//     "enabled": true
//   }
// }


// services/analyze.service.js
import TestRun from "../models/testRun.model.js";
import { runSingleTest } from "./testRunner.service.js";
import { testSQLi, testXSS, testAuth } from "./security.service.js";

export const runFullAnalysis = async (input, userId) => {
  const { tests = [], security } = input;

  let testResults = [];
  let passed = 0;
  let failed = 0;

  // 🔹 Functional Tests
  for (const test of tests) {
    try {
      const result = await runSingleTest(test);

      if (result.status === "pass") passed++;
      else failed++;

      testResults.push(result);

    } catch (err) {
      failed++;
      testResults.push({
        name: test.name,
        status: "fail",
        error: err.message
      });
    }
  }

  // 🔹 Security Tests
  let securityResults = [];

  if (security?.enabled && tests.length > 0) {
    const baseConfig = tests[0];

    const sqli = await testSQLi(baseConfig);
    const xss = await testXSS(baseConfig);
    const auth = await testAuth(baseConfig);

    securityResults = [sqli, xss, auth];
  }

  // 🔹 Summary
  const resultData = {
    userId,
    summary: {
      totalTests: tests.length,
      passed,
      failed,
      vulnerabilities: securityResults.filter(r => r.vulnerable).length
    },
    functional: testResults,
    security: securityResults
  };

  // ✅ SAVE TO DB
  const savedRun = await TestRun.create(resultData);

  return savedRun;
};



// Output Format :


// {
//     "success": true,
//     "data": {
//       "summary": {
//         "totalTests": 1,
//         "passed": 1,
//         "failed": 0,
//         "vulnerabilities": 1
//       },
//       "functional": [
//         {
//           "name": "Get Posts",
//           "status": "pass",
//           "responseTime": 120
//         }
//       ],
//       "security": [
//         {
//           "type": "SQL Injection",
//           "vulnerable": true
//         }
//       ]
//     }
//   }