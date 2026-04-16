// REQUEST FORMAT
// {
//   "url": "https://example.com/api/login",
//   "method": "POST",
//   "headers": {},
//   "body": {
//     "username": "test",
//     "password": "test"
//   }
// }


// services/security.service.js
import axios from "axios";

// 🔹 SQL Injection Test
export const testSQLi = async (config) => {
  const payloads = ["' OR '1'='1", "' OR TRUE--"];

  for (let payload of payloads) {
    try {
      const modifiedBody = { ...config.body };

      // inject payload into all fields
      for (let key in modifiedBody) {
        modifiedBody[key] = payload;
      }

      const res = await axios({
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: modifiedBody
      });

      if (
        typeof res.data === "string" &&
        res.data.toLowerCase().includes("sql")
      ) {
        return {
          vulnerable: true,
          type: "SQL Injection",
          reason: "SQL-related error message detected"
        };
      }

    } catch (err) {
      if (err.response?.status === 500) {
        return {
          vulnerable: true,
          type: "SQL Injection",
          reason: "Server error on SQL payload"
        };
      }
    }
  }

  return { vulnerable: false, type: "SQL Injection" };
};

// 🔹 XSS Test
export const testXSS = async (config) => {
  const payload = "<script>alert(1)</script>";

  try {
    const modifiedBody = { ...config.body };

    for (let key in modifiedBody) {
      modifiedBody[key] = payload;
    }

    const res = await axios({
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: modifiedBody
    });

    if (
      typeof res.data === "string" &&
      res.data.includes(payload)
    ) {
      return {
        vulnerable: true,
        type: "XSS",
        reason: "Payload reflected in response"
      };
    }

  } catch (err) {}

  return { vulnerable: false, type: "XSS" };
};

// 🔹 Auth Check
export const testAuth = async (config) => {
  try {
    const res = await axios({
      method: config.method,
      url: config.url
    });

    if (res.status === 200) {
      return {
        vulnerable: true,
        type: "Auth",
        reason: "Accessible without authentication"
      };
    }

  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      return { vulnerable: false, type: "Auth" };
    }
  }

  return { vulnerable: false, type: "Auth" };
};




// Output format :

// {
//     "summary": {
//       "total": 3,
//       "vulnerabilities": 1
//     },
//     "results": [
//       {
//         "vulnerable": true,
//         "type": "SQL Injection",
//         "reason": "Server error on SQL payload"
//       },
//       {
//         "vulnerable": false,
//         "type": "XSS"
//       },
//       {
//         "vulnerable": false,
//         "type": "Auth"
//       }
//     ]
//   }