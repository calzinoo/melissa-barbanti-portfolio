"use client";

import { useCallback, useState } from "react";

/**
 * Counts uploaders that currently have uploads in flight, so a form can block
 * submission until every image is stored. Pass `onBusyChange` to each ImageUploader.
 */
export function useUploadTracker() {
  const [active, setActive] = useState(0);
  const onBusyChange = useCallback((busy: boolean) => setActive((n) => Math.max(0, n + (busy ? 1 : -1))), []);
  return { uploading: active > 0, onBusyChange };
}
