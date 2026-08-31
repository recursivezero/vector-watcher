import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";

export interface AppInfo {
  version: string;
  platform: string;
}

export async function getAppInfo(): Promise<AppInfo> {
  if (!isTauri()) {
    return {
      version: "Development",
      platform: navigator.userAgent
    };
  }

  try {
    const version = await getVersion();

    return {
      version,
      platform: navigator.platform
    };
  } catch (error) {
    console.error("[getAppInfo] Failed to load app information:", error);

    throw error;
  }
}

export function formatDiagnosticInfo(appInfo: AppInfo): string {
  return [
    "Vector Watcher Diagnostic Information",
    "",
    "Application: Vector Watcher",
    `Date: ${new Date()}`,
    `Version: ${appInfo.version}`,
    `Platform: ${appInfo.platform}`,
    "",
    "Technology:",
    "Desktop: Tauri",
    "Frontend: React + TypeScript",
    "Backend: Python",
    "Database: LanceDB"
  ].join("\n");
}
