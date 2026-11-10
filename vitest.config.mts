import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

// realpath.native fixes the Windows drive-letter case ("c:" vs "C:"), which otherwise
// makes Vitest load two module instances and fail with "failed to find the current suite".
const root = fs.realpathSync.native(process.cwd());

export default defineConfig({
  root,
  plugins: [react()],
  resolve: { alias: { "@": path.join(root, "src") } },
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
    setupFiles: ["src/__tests__/helpers/setup.ts"],
  },
});
