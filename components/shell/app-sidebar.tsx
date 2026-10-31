import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { can, ROLE_LABELS } from "@/lib/authz/policy";
import { NAVIGATION, type NavSection } from "@/lib/navigation";
import { Avatar } from "@/components/ui/avatar";
import { NavShell } from "./nav-shell";

/**
 * Navigation filtrée côté serveur selon les permissions de l'utilisateur.
 * Sans session valide elle ne rend rien : c'est la page qui décide de la
 * redirection (évite deux redirections concurrentes).
 */
export async function AppSidebar() {
  const user = await getCurrentUser();
  if (!user) return null;
  const sections: NavSection[] = NAVIGATION.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.action || can(user, item.action)),
  })).filter((section) => section.items.length > 0);

  return (
    <NavShell sections={sections} user={{ name: user.name, roleLabel: ROLE_LABELS[user.role], image: user.image }} />
  );
}

export function SidebarSkeleton() {
  return (
    <>
      <div className="h-16 bg-surface lg:hidden" aria-hidden />
      <div className="hidden w-[17rem] shrink-0 rounded-[1.75rem] bg-surface lg:block" aria-hidden />
    </>
  );
}

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Libreville",
});

/** Barre supérieure (ordinateur) : date du jour et utilisateur connecté, comme sur la maquette. */
export async function AppTopbar() {
  const user = await getCurrentUser();
  if (!user) return null;
  const today = formatDate.format(new Date());
  return (
    <div className="mb-6 hidden items-center justify-between gap-4 lg:flex">
      <p className="text-sm font-medium text-zinc-600 first-letter:uppercase">{today}</p>
      <Link
        href="/profil"
        className="flex items-center gap-3 rounded-full bg-surface py-1.5 pl-1.5 pr-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <Avatar name={user.name} src={user.image} size="sm" />
        <span className="leading-tight">
          <span className="block text-sm font-semibold">{user.name}</span>
          <span className="block text-xs text-zinc-500">{ROLE_LABELS[user.role]}</span>
        </span>
      </Link>
    </div>
  );
}

export function TopbarSkeleton() {
  return <div className="mb-6 hidden h-12 lg:block" aria-hidden />;
}
