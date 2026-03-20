import { NextResponse } from "next/server";

import type { AdminHealthStatus } from "./types";

const MOCK_API_ERROR_MESSAGE =
  "Production environment cannot use Next mock API routes. EdgeOne edge-functions must handle /api/*.";

export function isDevelopmentMockApiEnabled() {
  return process.env.NODE_ENV === "development";
}

export function createMockApiBlockedResponse() {
  return NextResponse.json(
    {
      error: MOCK_API_ERROR_MESSAGE,
      backendOrigin: "next-mock-api",
      storageMode: "mock",
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "x-backend-origin": "next-mock-api",
        "x-storage-mode": "mock",
        "x-mock-api-status": "blocked-production",
      },
    },
  );
}

export function createMockHealthStatus(): AdminHealthStatus {
  return {
    ok: false,
    storageMode: "mock",
    backendOrigin: "next-mock-api",
    hasKvBinding: false,
    kvBindingName: "NFT_EXPERIMENT_KV",
    respondentCount: 0,
    submissionCount: 0,
    notices: ["Development mock API is active."],
    warnings: [
      "Current backend is Next mock API, not the formal EdgeOne edge-functions backend.",
    ],
    error: MOCK_API_ERROR_MESSAGE,
  };
}
