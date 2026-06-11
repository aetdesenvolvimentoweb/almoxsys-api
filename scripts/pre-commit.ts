#!/usr/bin/env bun

import { $ } from "bun";

console.log("🔍 Running pre-commit checks...\n");

try {
  console.log("📝 Linting and formatting with Biome...");
  await $`bunx biome check --write src tests`;

  console.log("\n✅ Biome passed!");
  console.log("\n🧪 Running tests...");
  await $`bun test`;

  console.log("\n✨ All pre-commit checks passed!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ Pre-commit checks failed!");
  console.error(error);
  process.exit(1);
}
