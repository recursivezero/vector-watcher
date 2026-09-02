import { isTauri } from "@tauri-apps/api/core";

export async function confirmAction(message: string): Promise<boolean> {
  console.log("[confirmAction] clicked");
  console.log("[confirmAction] isTauri:", isTauri());

  if (!isTauri()) {
    console.log("[confirmAction] using browser confirm");

    return window.confirm(message);
  }

  try {
    console.log("[confirmAction] loading Tauri dialog plugin");

    const { ask } = await import("@tauri-apps/plugin-dialog");

    console.log("[confirmAction] showing Tauri dialog");

    const result = await ask(message, {
      title: "Confirm action",
      kind: "warning"
    });

    console.log("[confirmAction] result:", result);

    return result;
  } catch (error) {
    console.error("[confirmAction] failed:", error);

    return false;
  }
}
