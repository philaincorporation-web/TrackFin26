import type { Action } from "@/lib/authz/policy";

export type NavIcon =
  | "home"
  | "dashboard"
  | "expenses"
  | "invoices"
  | "treasury"
  | "reports"
  | "staff"
  | "payslips"
  | "history"
  | "notifications"
  | "settings";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  /** Permission requise pour voir l'entrée (aucune = tout utilisateur connecté). */
  action?: Action;
  /** Lot de livraison ; une entrée non livrée s'affiche « Bientôt » sans lien. */
  available: boolean;
};

export type NavSection = { title: string; items: NavItem[] };

export const NAVIGATION: NavSection[] = [
  {
    title: "Menu",
    items: [
      { href: "/", label: "Accueil", icon: "home", available: true },
      { href: "/tableau-de-bord", label: "Tableau de bord", icon: "dashboard", action: "dashboard.view", available: false },
      { href: "/notifications", label: "Notifications", icon: "notifications", action: "notification.read", available: false },
    ],
  },
  {
    title: "Finances",
    items: [
      { href: "/depenses", label: "Dépenses", icon: "expenses", action: "expense.read", available: false },
      { href: "/factures", label: "Factures", icon: "invoices", action: "invoice.read", available: false },
      { href: "/tresorerie", label: "Trésorerie", icon: "treasury", action: "treasury.read", available: false },
      { href: "/rapports", label: "Rapports", icon: "reports", action: "report.read", available: false },
    ],
  },
  {
    title: "Personnel",
    items: [
      { href: "/personnel", label: "Personnel et paie", icon: "staff", action: "employee.read", available: false },
      { href: "/mes-bulletins", label: "Mes bulletins", icon: "payslips", action: "payslip.readOwn", available: false },
    ],
  },
  {
    title: "Outils",
    items: [
      { href: "/historique", label: "Historique", icon: "history", action: "audit.read", available: false },
      { href: "/parametres", label: "Paramètres", icon: "settings", action: "settings.read", available: true },
    ],
  },
];
