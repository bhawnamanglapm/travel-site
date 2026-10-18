// Runs webpack 4 on current Node versions. Webpack 4 hashes with MD4, which OpenSSL 3
// (Node 17+) disables, so the legacy provider flag is needed. Usage: node scripts/webpack.mjs production|dev
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mode = process.argv[2] === "dev" ? "development" : "production";
const bin = require.resolve("webpack-cli/bin/cli.js");
const legacy = Number(process.versions.node.split(".")[0]) >= 17 ? "--openssl-legacy-provider" : "";
const env = { ...process.env, NODE_OPTIONS: [process.env.NODE_OPTIONS, legacy].filter(Boolean).join(" ") };
const r = spawnSync(process.execPath, [bin, "--mode", mode], { stdio: "inherit", env });
process.exit(r.status ?? 1);
