#!/usr/bin/env bun

import { $ } from "bun";

console.log("🔍 Running pre-commit checks...\n");

try {
  console.log("📝 Verificando a padronização do código com o Biome...");
  await $`bunx biome check --write src tests`;
  await $`git add -u`;

  console.log("\n✅ Biome passou!");
  console.log("\n🧪 Executando testes...");
  await $`bun test`;

  console.log("\n✨ Todos os checks do pre-commit passaram!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ Os checks do pre-commit falharam!");
  console.error(error);
  process.exit(1);
}
