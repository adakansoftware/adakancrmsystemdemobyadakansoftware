import { buildHealthSummary } from "../lib/health.ts";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function testHealthySummary() {
  const summary = buildHealthSummary({
    appUrlConfigured: true,
    sessionSecretConfigured: true,
    databaseConfigured: true,
    directUrlConfigured: true,
    databaseOk: true,
    userCount: 4,
  });

  assert(summary.ok === true, "Healthy summary ok olmali");
  assert(summary.status === "ok", "Healthy summary status ok olmali");
  assert(summary.envReady === true, "Healthy summary envReady true olmali");
  assert(summary.envWarnings.length === 0, "Healthy summary warning icermemeli");
}

function testWarnSummary() {
  const summary = buildHealthSummary({
    appUrlConfigured: false,
    sessionSecretConfigured: true,
    databaseConfigured: true,
    directUrlConfigured: false,
    databaseOk: true,
    userCount: 0,
  });

  assert(summary.ok === false, "Warn summary ok false olmali");
  assert(summary.status === "warn", "Warn summary status warn olmali");
  assert(summary.envWarnings.length >= 1, "Warn summary warning icermeli");
}

function testErrorSummary() {
  const summary = buildHealthSummary({
    appUrlConfigured: false,
    sessionSecretConfigured: false,
    databaseConfigured: false,
    directUrlConfigured: false,
    databaseOk: false,
    userCount: 0,
  });

  assert(summary.ok === false, "Error summary ok false olmali");
  assert(summary.status === "error", "Error summary status error olmali");
  assert(summary.envReady === false, "Error summary envReady false olmali");
}

testHealthySummary();
testWarnSummary();
testErrorSummary();
console.log("Unit checks passed");
