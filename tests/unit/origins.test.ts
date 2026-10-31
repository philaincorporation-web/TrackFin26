import { describe, expect, it } from "vitest";
import { canonicalOrigin, trustedOrigins } from "@/lib/auth/origins";

const vercelProd = {
  VERCEL_ENV: "production",
  VERCEL_PROJECT_PRODUCTION_URL: "track-fin26.vercel.app",
  VERCEL_URL: "track-fin26-abc123-philaincs-projects.vercel.app",
  VERCEL_BRANCH_URL: "track-fin26-git-main-philaincs-projects.vercel.app",
};

describe("adresses autorisées", () => {
  it("en local : uniquement BETTER_AUTH_URL", () => {
    const env = { BETTER_AUTH_URL: "http://localhost:3000" };
    expect(trustedOrigins(env)).toEqual(["http://localhost:3000"]);
    expect(canonicalOrigin(env)).toBe("http://localhost:3000");
  });

  it("sur Vercel : le domaine de production est accepté même si BETTER_AUTH_URL est resté sur localhost", () => {
    const env = { ...vercelProd, BETTER_AUTH_URL: "http://localhost:3000" };
    expect(trustedOrigins(env)).toContain("https://track-fin26.vercel.app");
    expect(trustedOrigins(env)).toContain("https://track-fin26-abc123-philaincs-projects.vercel.app");
    expect(canonicalOrigin(env)).toBe("https://track-fin26.vercel.app");
  });

  it("normalise les adresses (barre finale, chemin) et retire les doublons", () => {
    const env = { ...vercelProd, BETTER_AUTH_URL: "https://track-fin26.vercel.app/" };
    const origins = trustedOrigins(env);
    expect(origins.filter((o) => o === "https://track-fin26.vercel.app")).toHaveLength(1);
    expect(origins.every((o) => !o.endsWith("/"))).toBe(true);
  });

  it("ignore une valeur invalide", () => {
    expect(trustedOrigins({ BETTER_AUTH_URL: "pas une url" })).toEqual([]);
  });
});
