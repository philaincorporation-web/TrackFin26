import Link from "next/link";
import { cx } from "@/components/ui/primitives";

export function SettingsTabs({ current, showUsers }: { current: "entreprise" | "utilisateurs"; showUsers: boolean }) {
  const tabs = [
    { key: "entreprise", href: "/parametres/entreprise", label: "Entreprise" },
    ...(showUsers ? [{ key: "utilisateurs", href: "/parametres/utilisateurs", label: "Utilisateurs" }] : []),
  ];
  return (
    <nav
      aria-label="Sections des paramètres"
      className="mb-6 inline-flex gap-1 rounded-full bg-surface p-1 shadow-[0_1px_2px_rgba(16,24,16,0.05)]"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === current ? "page" : undefined}
          className={cx(
            "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
            tab.key === current ? "bg-pine-800 text-white shadow-md shadow-pine-900/20" : "text-zinc-600 hover:text-ink",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
