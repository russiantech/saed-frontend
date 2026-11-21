import { useSyncExternalStore } from "react";

import { getInstallSnapshot, subscribeInstall } from "lib/pwa.js";

/** { canPrompt, installed } - live, shared across all components. */
export default function useInstall() {
  return useSyncExternalStore(subscribeInstall, getInstallSnapshot, getInstallSnapshot);
}
