import { isTauri } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";

export async function confirmAction(message: string): Promise<boolean> {
  if (!isTauri()) {
    return window.confirm(message);
  }

  try {
    const result = await ask(message, {
      title: "Confirm action",
      kind: "warning"
    });

    return result;
  } catch (error) {
    console.error("[confirmAction] failed:", error);
    return false;
  }
}
