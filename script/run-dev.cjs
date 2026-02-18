#!/usr/bin/env node
/**
 * Start the dev server using Node only (no npm required in PATH).
 * Run from repo root: node script/run-dev.cjs
 * Requires: node in PATH, and npm install already run.
 */
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const serverEntry = path.join(root, "server", "index.ts");

const env = { ...process.env, NODE_ENV: "development" };
const child = spawn(
  process.execPath,
  [tsxCli, serverEntry],
  {
    stdio: "inherit",
    cwd: root,
    env,
    shell: false,
  }
);

child.on("error", (err) => {
  console.error("Failed to start:", err.message);
  if (err.message && err.message.includes("ENOENT")) {
    console.error("\nRun 'npm install' first, then try again.");
  }
  process.exit(1);
});

child.on("exit", (code, signal) => {
  process.exit(code != null ? code : signal ? 1 : 0);
});
