export const runHistory = [
  { name: "Mon", tests: 128, alerts: 3 },
  { name: "Tue", tests: 186, alerts: 1 },
  { name: "Wed", tests: 142, alerts: 4 },
  { name: "Thu", tests: 210, alerts: 2 },
  { name: "Fri", tests: 190, alerts: 0 },
  { name: "Sat", tests: 232, alerts: 1 },
  { name: "Sun", tests: 178, alerts: 2 },
];

export const latencyData = [
  { name: "Auth", ms: 120 },
  { name: "Users", ms: 84 },
  { name: "Orders", ms: 210 },
  { name: "Billing", ms: 160 },
  { name: "Search", ms: 132 },
];

export const agentStatus = [
  {
    title: "Testing Agent",
    status: "Running",
    detail: "Generating 24 functional + 12 edge-case tests",
  },
  {
    title: "Security Agent",
    status: "Queued",
    detail: "SQLi + XSS + CORS passive checks",
  },
  {
    title: "Deployment Agent",
    status: "Standby",
    detail: "Render / Railway ready",
  },
];

export const sampleRequests = [
  {
    method: "GET",
    path: "/v1/users",
    latency: "92 ms",
    status: "200 OK",
  },
  {
    method: "POST",
    path: "/v1/auth/login",
    latency: "145 ms",
    status: "401 Unauthorized",
  },
  {
    method: "PUT",
    path: "/v1/orders/3021",
    latency: "210 ms",
    status: "409 Conflict",
  },
];
