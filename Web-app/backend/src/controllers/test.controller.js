// controllers/test.controller.js
import axios from "axios";

export const runTests = async (req, res) => {
  const { tests = [] } = req.body;

  let results = [];
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const start = Date.now();

    try {
      const response = await axios({
        method: test.method,
        url: test.url,
        headers: test.headers || {},
        data: test.body || {},
        validateStatus: () => true
      });

      const end = Date.now();
      const responseTime = end - start;

      let assertionsResult = [];

      const data = response.data;

      // ✅ 1. Status Check
      if (test.assertions?.status) {
        const pass = response.status === test.assertions.status;

        assertionsResult.push({
          check: "Status Code",
          expected: test.assertions.status,
          actual: response.status,
          pass
        });
      }

      // ✅ 2. Response Time
      if (test.assertions?.responseTimeLessThan) {
        const pass = responseTime < test.assertions.responseTimeLessThan;

        assertionsResult.push({
          check: "Response Time",
          expected: `< ${test.assertions.responseTimeLessThan}ms`,
          actual: `${responseTime}ms`,
          pass
        });
      }

      // ✅ 3. Field Exists
      if (test.assertions?.hasField) {
        const field = test.assertions.hasField;
        const pass = data.hasOwnProperty(field);

        assertionsResult.push({
          check: `Field '${field}' exists`,
          pass
        });
      }

      // ✅ 4. Field Equals
      if (test.assertions?.fieldEquals) {
        for (const key in test.assertions.fieldEquals) {
          const expected = test.assertions.fieldEquals[key];
          const actual = data[key];
          const pass = actual === expected;

          assertionsResult.push({
            check: `Field '${key}' equals`,
            expected,
            actual,
            pass
          });
        }
      }

      // ✅ 5. Field Type
      if (test.assertions?.fieldType) {
        for (const key in test.assertions.fieldType) {
          const expectedType = test.assertions.fieldType[key];
          const actualType = typeof data[key];
          const pass = actualType === expectedType;

          assertionsResult.push({
            check: `Field '${key}' type`,
            expected: expectedType,
            actual: actualType,
            pass
          });
        }
      }

      const isTestPassed = assertionsResult.every(a => a.pass);

      if (isTestPassed) passed++;
      else failed++;

      results.push({
        name: test.name,
        status: isTestPassed ? "pass" : "fail",
        responseTime,
        assertions: assertionsResult
      });

    } catch (error) {
      failed++;

      results.push({
        name: test.name,
        status: "fail",
        error: error.response?.data || error.message
      });
    }
  }

  return res.json({
    summary: {
      total: tests.length,
      passed,
      failed
    },
    results
  });
};




// Updated Request format for testing :

// {
//     "tests": [
//       {
//         "name": "Check Posts API",
//         "method": "GET",
//         "url": "https://jsonplaceholder.typicode.com/posts/1",
//         "assertions": {
//           "status": 200,
//           "responseTimeLessThan": 500,
//           "hasField": "userId",
//           "fieldEquals": { "userId": 1 },
//           "fieldType": { "userId": "number" }
//         }
//       }
//     ]
//   }





// Output format : 

// {
//     "summary": {
//       "total": 1,
//       "passed": 1,
//       "failed": 0
//     },
//     "results": [
//       {
//         "name": "Check Posts API",
//         "status": "pass",
//         "responseTime": 120,
//         "assertions": [
//           {
//             "check": "Status Code",
//             "pass": true
//           },
//           {
//             "check": "Response Time",
//             "pass": true
//           },
//           {
//             "check": "Field 'userId' exists",
//             "pass": true
//           },
//           {
//             "check": "Field 'userId' equals",
//             "pass": true
//           },
//           {
//             "check": "Field 'userId' type",
//             "pass": true
//           }
//         ]
//       }
//     ]
//   }