import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Tests d'intégration sur une VRAIE base Neon de test (jamais main) :
 *   INTEGRATION_DATABASE_URL=<branche de test> npm run test:integration
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // "server-only" lève une erreur hors du runtime React Server : neutralisé ici.
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    include: ["tests/integration/**/*.int.test.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
