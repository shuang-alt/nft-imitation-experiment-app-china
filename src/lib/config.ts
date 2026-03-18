import { type StorageMode } from "./types";

const PLACEHOLDER_PREFIXES = ["__", "<", "[", "TODO", "YOUR_"];

export const env = {
  nextPublicDatabaseUrl: process.env.NEXT_PUBLIC_DATABASE_URL ?? "",
  nextPublicDatabaseAnonKey: process.env.NEXT_PUBLIC_DATABASE_ANON_KEY ?? "",
  databaseServiceRoleKey: process.env.DATABASE_SERVICE_ROLE_KEY ?? "",
  responsesTableName: process.env.RESPONSES_TABLE_NAME ?? "",
  pageEventsTableName: process.env.PAGE_EVENTS_TABLE_NAME ?? "",
  respondentsTableName: process.env.RESPONDENTS_TABLE_NAME ?? "",
  apiBaseUrl: process.env.API_BASE_URL ?? "",
  adminDashboardPassword: process.env.ADMIN_DASHBOARD_PASSWORD ?? "",
  customDomain: process.env.CUSTOM_DOMAIN ?? "",
};

export const requiredEnvironmentKeys = [
  "NEXT_PUBLIC_DATABASE_URL",
  "NEXT_PUBLIC_DATABASE_ANON_KEY",
  "DATABASE_SERVICE_ROLE_KEY",
  "RESPONSES_TABLE_NAME",
  "PAGE_EVENTS_TABLE_NAME",
  "RESPONDENTS_TABLE_NAME",
  "API_BASE_URL",
  "ADMIN_DASHBOARD_PASSWORD",
  "CUSTOM_DOMAIN",
] as const;

export function isConfiguredValue(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  return !PLACEHOLDER_PREFIXES.some((prefix) =>
    normalized.toUpperCase().startsWith(prefix.toUpperCase()),
  );
}

export function isDatabaseConfigured() {
  return [
    env.nextPublicDatabaseUrl,
    env.databaseServiceRoleKey,
    env.responsesTableName,
    env.pageEventsTableName,
    env.respondentsTableName,
  ].every(isConfiguredValue);
}

export function isAdminPasswordEnabled() {
  return isConfiguredValue(env.adminDashboardPassword);
}

export function getStorageMode(): StorageMode {
  return isDatabaseConfigured() ? "database" : "mock";
}
