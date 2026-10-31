import { describe, expect, it } from "vitest";
import { assertCan, can, ForbiddenError, POLICY, ROLES, scopeOf, type Action, type Role, type Scope } from "@/lib/authz/policy";

/**
 * Matrice attendue, recopiée volontairement à la main depuis
 * docs/01-ARCHITECTURE.md §3 : si policy.ts change sans que ce tableau soit
 * mis à jour, le test échoue.
 */
const EXPECTED: Record<Action, [Scope | null, Scope | null, Scope | null, Scope | null]> = {
  //                       DIRECTRICE  ADMIN   SECRETAIRE  COLLABORATEUR
  "dashboard.view":       ["all", "all", "all", null],
  "report.read":          ["all", "all", "all", null],
  "audit.read":           ["all", "all", "all", null],
  "expense.create":       [null, null, "all", "own"],
  "expense.read":         ["all", "all", "all", "own"],
  "expense.review":       [null, null, "all", null],
  "expense.adminConfirm": [null, "all", null, null],
  "expense.post":         [null, null, "all", null],
  "expense.addAttachment":[null, null, "all", "own"],
  "file.read":            ["all", "all", "all", "own"],
  "comment.create":       ["all", "all", "all", "own"],
  "invoice.read":         ["all", "all", "all", null],
  "invoice.manage":       [null, null, "all", null],
  "treasury.read":        ["all", "all", "all", null],
  "treasury.update":      [null, null, "all", null],
  "employee.read":        ["all", "all", "all", null],
  "employee.manage":      [null, null, "all", null],
  "payroll.prepare":      [null, null, "all", null],
  "payroll.validate":     ["all", "all", null, null],
  "salaryPayment.read":   ["all", "all", "all", null],
  "salaryPayment.create": [null, null, "all", null],
  "payslip.readOwn":      ["own", "own", "own", "own"],
  "settings.read":        ["all", "all", null, null],
  "settings.manage":      [null, "all", null, null],
  "users.manage":         [null, "all", null, null],
  "profile.manageOwn":    ["own", "own", "own", "own"],
  "notification.read":    ["own", "own", "own", "own"],
};

describe("matrice des permissions", () => {
  it("couvre exactement les actions de la politique", () => {
    expect(Object.keys(EXPECTED).sort()).toEqual(Object.keys(POLICY).sort());
  });

  for (const action of Object.keys(EXPECTED) as Action[]) {
    ROLES.forEach((role, i) => {
      it(`${role} → ${action} = ${EXPECTED[action][i] ?? "interdit"}`, () => {
        expect(scopeOf(role, action)).toBe(EXPECTED[action][i]);
      });
    });
  }
});

describe("can() et la portée own", () => {
  const collab = { id: "u-collab", role: "COLLABORATEUR" as Role };
  const secretaire = { id: "u-sec", role: "SECRETAIRE" as Role };

  it("un collaborateur lit sa propre dépense", () => {
    expect(can(collab, "expense.read", { ownerId: "u-collab" })).toBe(true);
  });

  it("un collaborateur ne lit jamais la dépense d'autrui", () => {
    expect(can(collab, "expense.read", { ownerId: "u-autre" })).toBe(false);
  });

  it("un propriétaire absent ou nul ne donne aucun droit own", () => {
    expect(can(collab, "file.read", { ownerId: null })).toBe(false);
    expect(can(collab, "file.read", { ownerId: undefined })).toBe(false);
    expect(can(collab, "file.read", { ownerId: "" })).toBe(false);
  });

  it("la portée all ignore le propriétaire", () => {
    expect(can(secretaire, "expense.read", { ownerId: "u-collab" })).toBe(true);
  });

  it("un collaborateur n'accède ni aux factures ni au tableau de bord global", () => {
    expect(can(collab, "invoice.read")).toBe(false);
    expect(can(collab, "dashboard.view")).toBe(false);
    expect(can(collab, "salaryPayment.read")).toBe(false);
  });

  it("assertCan lève ForbiddenError en cas de refus", () => {
    expect(() => assertCan(collab, "users.manage")).toThrow(ForbiddenError);
    expect(() => assertCan(secretaire, "invoice.manage")).not.toThrow();
  });
});
