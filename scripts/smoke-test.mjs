import { spawn } from "node:child_process";

const port = process.env.SMOKE_PORT || "3010";
const baseUrl = process.env.SMOKE_BASE_URL || `http://127.0.0.1:${port}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const text = await response.text();
  return { response, text };
}

async function waitForServer(timeoutMs = 30000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/login`, { redirect: "manual" });
      if (response.status === 200) {
        return;
      }
    } catch {
      // server not ready yet
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Smoke server ${baseUrl} zamaninda hazir olmadi.`);
}

async function runChecks() {
  const health = await request("/api/health");
  assert(
    health.response.status === 200 || health.response.status === 503,
    `/api/health beklenmeyen durum dondu: ${health.response.status}`,
  );
  assert(health.response.headers.get("x-health-status"), "/api/health x-health-status basligi donmedi");
  assert(health.response.headers.get("x-content-type-options") === "nosniff", "/api/health nosniff basligi eksik");
  assert(health.response.headers.get("x-robots-tag") === "noindex, nofollow", "/api/health robots basligi eksik");
  assert(health.text.includes("\"status\":"), "/api/health status alani eksik");
  assert(health.text.includes("\"checks\":"), "/api/health checks alani eksik");

  const login = await request("/login");
  assert(login.response.status === 200, `/login beklenmeyen durum dondu: ${login.response.status}`);
  assert(login.text.includes("CRM Login"), "/login beklenen basligi donmedi");

  const protectedRoute = await fetch(`${baseUrl}/musteriler`, { redirect: "manual" });
  assert(
    [307, 308].includes(protectedRoute.status),
    `/musteriler login redirect beklenirken ${protectedRoute.status} dondu`,
  );
}

async function main() {
  const server = spawn(`npm run start -- --port ${port}`, {
    stdio: "ignore",
    shell: true,
  });

  try {
    await waitForServer();
    await runChecks();
    console.log("Smoke checks passed");
  } finally {
    if (!server.killed) {
      server.kill("SIGTERM");
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
