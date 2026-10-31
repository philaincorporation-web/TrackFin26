import { describe, expect, it } from "vitest";
import {
  generateInvitationCode,
  hashInvitationCode,
  isWellFormedInvitationCode,
  normalizeInvitationCode,
} from "@/lib/invitations/code";
import { signupSchemaFor, SIGNUP_PROFILES } from "@/lib/validation/signup";
import { ROLES } from "@/lib/authz/policy";

describe("codes d'invitation", () => {
  it("génère un code au format XXXX-XXXX sans caractères ambigus", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInvitationCode();
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(code).not.toMatch(/[01OIL]/);
      expect(isWellFormedInvitationCode(code)).toBe(true);
    }
  });

  it("tolère minuscules, espaces et tirets à la saisie", () => {
    expect(normalizeInvitationCode(" k7p4 - m2qx ")).toBe("K7P4M2QX");
    expect(hashInvitationCode("k7p4m2qx")).toBe(hashInvitationCode("K7P4-M2QX"));
  });

  it("refuse un code mal formé", () => {
    expect(isWellFormedInvitationCode("K7P4-M2Q")).toBe(false);
    expect(isWellFormedInvitationCode("K7P4-M2Q0")).toBe(false); // 0 exclu
  });

  it("ne stocke qu'une empreinte hexadécimale", () => {
    expect(hashInvitationCode("K7P4-M2QX")).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("formulaire de création de compte par profil", () => {
  const base = {
    email: "personne@exemple.com",
    code: "K7P4-M2QX",
    name: "Prénom Nom",
    password: "motdepasse-solide",
    passwordConfirm: "motdepasse-solide",
  };

  it("chaque profil a un formulaire configuré", () => {
    for (const role of ROLES) expect(SIGNUP_PROFILES[role].title).toBeTruthy();
  });

  it("refuse une confirmation de mot de passe différente", () => {
    const r = signupSchemaFor("DIRECTRICE").safeParse({ ...base, passwordConfirm: "autre-chose-123" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["passwordConfirm"]);
  });

  it("exige le poste pour un collaborateur, pas pour la direction", () => {
    expect(signupSchemaFor("COLLABORATEUR").safeParse(base).success).toBe(false);
    expect(signupSchemaFor("COLLABORATEUR").safeParse({ ...base, jobTitle: "Formatrice" }).success).toBe(true);
    expect(signupSchemaFor("DIRECTRICE").safeParse(base).success).toBe(true);
  });

  it("refuse un mot de passe trop court", () => {
    expect(signupSchemaFor("ADMIN").safeParse({ ...base, password: "court", passwordConfirm: "court" }).success).toBe(false);
  });
});

describe("adresse e-mail", () => {
  it("accepte une adresse collée avec espaces et majuscules, et la normalise", async () => {
    const { emailSchema } = await import("@/lib/validation/users");
    expect(emailSchema.parse("  Nom.Prenom@Exemple.COM ")).toBe("nom.prenom@exemple.com");
    expect(emailSchema.safeParse("pas-une-adresse").success).toBe(false);
  });
});
