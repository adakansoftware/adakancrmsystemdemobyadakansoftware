import { buildHealthSummary } from "../lib/health.ts";
import { SESSION_TTL_MS, SESSION_TTL_SECONDS } from "../lib/auth/constants.ts";
import {
  getLoginRateLimitKeys,
  LOGIN_RATE_LIMIT_ERROR_MESSAGE,
  resolveClientIp,
} from "../lib/auth/login-rate-limit.ts";
import {
  csvEscape,
  toCsv,
} from "../lib/export/csv.ts";
import { getExportEntityPermissions } from "../lib/export/permissions.ts";
import {
  toManagedRoleAssignmentSummary,
  toManagedUserSummary,
} from "../lib/auth/user-safe-select.ts";
import {
  isStrongPassword,
  passwordPolicyDescription,
  strongPasswordSchema,
} from "../lib/validation/password.ts";
import {
  exportRouteQuerySchema,
  searchRouteQuerySchema,
} from "../lib/validation/api.ts";
const {
  changePasswordSchema,
  createUserAccountSchema,
  loginSchema,
  setupSchema,
} = await import("../lib/validation/crm.ts");

process.env.DATABASE_URL ??= "postgresql://unit-test";

const { createEnv } = await import("../lib/env.ts");

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

function testSearchRouteSchema() {
  const summary = searchRouteQuerySchema.parse({});
  assert(summary.q === "", "Search schema bos q degeri uretmeli");
}

function testExportRouteSchema() {
  const summary = exportRouteQuerySchema.safeParse({ entity: "dashboard" });
  assert(summary.success === true, "Export schema dashboard entity kabul etmeli");

  const invalid = exportRouteQuerySchema.safeParse({ entity: "users" });
  assert(invalid.success === false, "Export schema bilinmeyen entity reddetmeli");
}

function testCreateEnvFailsClosedInProduction() {
  let didThrow = false;

  try {
    createEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://db",
    });
  } catch (error) {
    didThrow = true;
    assert(
      String(error).includes("NEXTAUTH_SECRET"),
      "Production secret hatasi anlamli olmali",
    );
  }

  assert(didThrow, "Production ortam secret olmadan baslamamali");

  const devEnv = createEnv({
    NODE_ENV: "development",
    DATABASE_URL: "postgresql://db",
  });

  assert(devEnv.sessionSecretConfigured === false, "Dev fallback secret configured sayilmamali");
  assert(devEnv.sessionSecret.length >= 32, "Dev fallback secret runtime uretimli olmali");

  const buildEnv = createEnv({
    NODE_ENV: "production",
    NEXT_PHASE: "phase-production-build",
    DATABASE_URL: "postgresql://db",
  });
  assert(buildEnv.sessionSecretConfigured === false, "Build fazi secret fallback'i durum bilgisini korumali");

  const productionEnv = createEnv({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://db",
    NEXTAUTH_SECRET: "production-secret",
    APP_URL: "https://crm.example.com",
  });
  assert(productionEnv.sessionSecretConfigured === true, "Production secret konfigurasyonu algilanmali");
  assert(productionEnv.appUrlConfigured === true, "Production app URL konfigurasyonu algilanmali");
}

function testSessionTtlIsConsistent() {
  assert(
    SESSION_TTL_SECONDS === Math.floor(SESSION_TTL_MS / 1000),
    "Session TTL second degeri milisaniyeden turemeli",
  );
}

function testClientIpResolution() {
  const trustedIp = resolveClientIp({
    forwardedFor: "198.51.100.10, 10.0.0.1",
    realIp: null,
    trustProxyHeaders: true,
  });
  assert(trustedIp === "198.51.100.10", "Trusted proxy ilk forwarded IP'yi kullanmali");

  const untrustedIp = resolveClientIp({
    forwardedFor: "198.51.100.10",
    realIp: "203.0.113.8",
    trustProxyHeaders: false,
  });
  assert(untrustedIp === "unknown", "Untrusted proxy header'lari kullanilmamali");

  const keys = getLoginRateLimitKeys("User@Example.com", "203.0.113.5");
  assert(keys[0] === "login:203.0.113.5", "IP bazli login key uretilmeli");
  assert(
    keys[1] === "login:203.0.113.5:user@example.com",
    "Email bazli login key normalize edilmeli",
  );
  assert(
    LOGIN_RATE_LIMIT_ERROR_MESSAGE.length > 10,
    "Rate limit hata mesaji tanimli olmali",
  );
}

function testCsvExportSafety() {
  assert(
    csvEscape('=cmd|"/c calc"!A0') === `"'=cmd|""/c calc""!A0"`,
    "CSV formula injection degeri tek tirnak ile notrlenmeli",
  );
  assert(csvEscape("normal") === `"normal"`, "Normal CSV degeri korunmali");

  const csv = toCsv(["Ad"], [["=SUM(1,1)"]]);
  assert(csv.includes(`"'=SUM(1,1)"`), "CSV satirlari guvenli escape edilmeli");
}

function testExportPermissionMapping() {
  const dashboardPermissions = getExportEntityPermissions("dashboard");
  assert(
    dashboardPermissions.includes("deals:read"),
    "Dashboard export deal okuma izni istemeli",
  );
  assert(
    getExportEntityPermissions("contacts")[0] === "contacts:read",
    "Contact export contacts:read istemeli",
  );
}

function testSensitiveUserFieldsStayOutOfResponses() {
  const userSummary = toManagedUserSummary({
    id: "user-1",
    email: "user@example.com",
    firstName: "Ada",
    lastName: "Kan",
    status: "ACTIVE",
    roles: [
      {
        roleId: "role-1",
        role: {
          id: "role-1",
          name: "Owner",
          slug: "owner",
        },
      },
    ],
  });

  const roleAssignmentSummary = toManagedRoleAssignmentSummary({
    userId: "user-1",
    roleId: "role-1",
    user: {
      id: "user-1",
      email: "user@example.com",
      firstName: "Ada",
      lastName: "Kan",
      status: "ACTIVE",
      roles: [
        {
          roleId: "role-1",
          role: {
            id: "role-1",
            name: "Owner",
            slug: "owner",
          },
        },
      ],
    },
    role: {
      id: "role-1",
      name: "Owner",
      slug: "owner",
    },
  });

  assert(
    JSON.stringify(userSummary).includes("passwordHash") === false,
    "User summary passwordHash sizdirmamali",
  );
  assert(
    JSON.stringify(roleAssignmentSummary).includes("passwordHash") === false,
    "Role assignment summary passwordHash sizdirmamali",
  );
}

function testPasswordPolicy() {
  assert(isStrongPassword("Admin123") === true, "Guclu sifre yardimcisi karma sifreyi kabul etmeli");
  assert(isStrongPassword("password") === false, "Guclu sifre yardimcisi zayif sifreyi reddetmeli");

  const weakPassword = strongPasswordSchema().safeParse("password");
  assert(weakPassword.success === false, "Strong password schema zayif sifreyi reddetmeli");
  assert(
    weakPassword.error.issues[0]?.message === passwordPolicyDescription,
    "Strong password schema politika mesajini donmeli",
  );

  const setupResult = setupSchema.safeParse({
    firstName: "Ada",
    lastName: "Kan",
    email: "ada@example.com",
    password: "Password1",
  });
  assert(setupResult.success === true, "Setup schema guclu sifreyi kabul etmeli");

  const weakSetupResult = setupSchema.safeParse({
    firstName: "Ada",
    lastName: "Kan",
    email: "ada@example.com",
    password: "password",
  });
  assert(weakSetupResult.success === false, "Setup schema zayif sifreyi reddetmeli");

  const createUserResult = createUserAccountSchema.safeParse({
    firstName: "Ada",
    lastName: "Kan",
    email: "ada@example.com",
    password: "Admin123",
    roleId: "role-1",
    status: "INVITED",
  });
  assert(createUserResult.success === true, "Kullanici olusturma schema guclu sifreyi kabul etmeli");

  const changePasswordResult = changePasswordSchema.safeParse({
    currentPassword: "Current123",
    nextPassword: "NextPass1",
    confirmPassword: "NextPass1",
  });
  assert(changePasswordResult.success === true, "Sifre degistirme schema guclu yeni sifreyi kabul etmeli");

  const weakChangePasswordResult = changePasswordSchema.safeParse({
    currentPassword: "Current123",
    nextPassword: "nextpass",
    confirmPassword: "nextpass",
  });
  assert(weakChangePasswordResult.success === false, "Sifre degistirme schema zayif yeni sifreyi reddetmeli");

  const loginResult = loginSchema.safeParse({
    email: "ada@example.com",
    password: "legacy123",
  });
  assert(loginResult.success === true, "Login schema eski mevcut sifreleri bloke etmemeli");
}

testHealthySummary();
testWarnSummary();
testErrorSummary();
testSearchRouteSchema();
testExportRouteSchema();
testCreateEnvFailsClosedInProduction();
testSessionTtlIsConsistent();
testClientIpResolution();
testCsvExportSafety();
testExportPermissionMapping();
testSensitiveUserFieldsStayOutOfResponses();
testPasswordPolicy();
console.log("Unit checks passed");
