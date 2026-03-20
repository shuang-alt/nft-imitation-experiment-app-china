import { type StorageMode } from "./types";

const PLACEHOLDER_PREFIXES = ["__", "<", "[", "TODO", "YOUR_"];

export const env = {
  apiBaseUrl: process.env.API_BASE_URL ?? "",
  adminDashboardPassword: process.env.ADMIN_DASHBOARD_PASSWORD ?? "",
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET ?? "",
  customDomain: process.env.CUSTOM_DOMAIN ?? "",
  firebaseDatabaseUrl: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? "",
};

export const requiredEnvironmentKeys = [
  "API_BASE_URL",
  "ADMIN_DASHBOARD_PASSWORD",
  "ADMIN_SESSION_SECRET",
  "CUSTOM_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
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

export function isAdminPasswordEnabled() {
  return isConfiguredValue(env.adminDashboardPassword);
}

export function isAdminSessionSecretEnabled() {
  return isConfiguredValue(env.adminSessionSecret);
}

export function isFirebaseDatabaseEnabled() {
  return isConfiguredValue(env.firebaseDatabaseUrl);
}

export function getStorageMode(): StorageMode {
  return "mock";
}
