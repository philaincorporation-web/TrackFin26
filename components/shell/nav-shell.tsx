"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import type { NavSection } from "@/lib/navigation";
import { BrandMark, cx } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/avatar";
import { signOutAction } from "@/app/(auth)/connexion/actions";
import { NAV_ICONS } from "./nav-icons";

export type UserSummary = { name: string; roleLabel: string; image: string | null };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Carte utilisateur sombre en bas du menu (à la place de « Upgrade Pro » de la maquette). */
function UserCard({ user }: { user: UserSummary }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-pine-900 p-3 text-sand-light">
      <div aria-hidden className="bg-dots absolute inset-0 text-white/[0.06]" />
      <div className="relative flex items-center gap-3">
        <Link href="/profil" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl" title="Mon profil">
          <Avatar name={user.name} src={user.image} size="md" className="ring-2 ring-white/20" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user.name}</span>
            <span className="block truncate text-xs text-sand-light/70">{user.roleLabel}</span>
          </span>
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Se déconnecter"
            title="Se déconnecter"
            className="grid size-9 place-items-center rounded-full bg-white/10 text-sand-light hover:bg-white/20"
          >
            <LogOut aria-hidden className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function NavContent({ sections, user, pathname }: { sections: NavSection[]; user: UserSummary; pathname: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav aria-label="Navigation principale" className="-mx-1 flex-1 space-y-5 overflow-y-auto px-1">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = NAV_ICONS[item.icon];
                if (!item.available) {
                  return (
                    <li key={item.href}>
                      <span
                        aria-disabled="true"
                        className="flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] text-zinc-400"
                      >
                        <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        <span className="rounded-full bg-canvas-soft px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                          Bientôt
                        </span>
                      </span>
                    </li>
                  );
                }
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors",
                        active
                          ? "bg-pine-800 text-white shadow-lg shadow-pine-900/20"
                          : "text-zinc-700 hover:bg-canvas-soft hover:text-ink",
                      )}
                    >
                      <Icon aria-hidden className="size-5" strokeWidth={active ? 2 : 1.75} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="mt-4">
        <UserCard user={user} />
      </div>
    </div>
  );
}

export function NavShell({ sections, user }: { sections: NavSection[]; user: UserSummary }) {
  const pathname = usePathname();
  // Le tiroir mobile est lié à la page sur laquelle il a été ouvert : il se
  // ferme de lui-même dès que la navigation change de page.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (value: boolean) => setOpenedOn(value ? pathname : null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Bureau */}
      <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-[17rem] shrink-0 flex-col rounded-[1.75rem] bg-surface p-5 shadow-[0_8px_30px_-12px_rgba(16,24,16,0.12)] lg:flex">
        <BrandMark className="mb-6 px-1 pt-1" />
        <NavContent sections={sections} user={user} pathname={pathname} />
      </aside>

      {/* Mobile */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 bg-surface/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <BrandMark />
        <div className="flex items-center gap-1">
          <Link href="/profil" aria-label="Mon profil" className="rounded-full">
            <Avatar name={user.name} src={user.image} size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            aria-controls="menu-mobile"
            className="grid size-11 place-items-center rounded-full hover:bg-canvas-soft"
          >
            <Menu aria-hidden className="size-6" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              id="menu-mobile"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col rounded-r-[1.75rem] bg-surface p-5"
              initial={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <BrandMark />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer le menu"
                  className="grid size-11 place-items-center rounded-full hover:bg-canvas-soft"
                  autoFocus
                >
                  <X aria-hidden className="size-6" />
                </button>
              </div>
              <NavContent sections={sections} user={user} pathname={pathname} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
