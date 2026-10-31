import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it("conserve un chemin interne", () => {
    expect(safeRedirectPath("/parametres/utilisateurs")).toBe("/parametres/utilisateurs");
  });

  it.each([
    ["https://exemple.com", "URL absolue"],
    ["//exemple.com", "URL relative au protocole"],
    ["/\\exemple.com", "barre oblique inversée"],
    ["parametres", "chemin sans barre initiale"],
    ["/a\nb", "caractère de contrôle"],
    ["", "chaîne vide"],
  ])("rejette %s (%s)", (value) => {
    expect(safeRedirectPath(value)).toBe("/");
  });

  it("utilise la valeur de repli si absente", () => {
    expect(safeRedirectPath(null, "/accueil")).toBe("/accueil");
  });
});
