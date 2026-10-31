import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/brand/digiwomen-school-logo.png";
import logoCreme from "@/public/brand/digiwomen-school-logo-creme.png";
// Visuels provisoires extraits de la maquette DigiWomen School : à remplacer par les photos originales HD.
import heroPhoto from "@/public/brand/provisoire-accueil.webp";
import headerPhoto from "@/public/brand/provisoire-connexion.webp";
import { cx } from "@/components/ui/primitives";

/**
 * Panneau photo vert pétrole : plein écran sur la page de bienvenue mobile,
 * colonne gauche fixe sur grand écran pour toutes les pages d'entrée.
 */
export function HeroPanel({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <section className={cx("relative isolate flex flex-col overflow-hidden bg-pine-900 text-sand-light", className)}>
      <Image
        src={heroPhoto}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="-z-10 object-cover object-[50%_20%] grayscale-[35%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(15,61,54,0.50)_0%,rgba(15,61,54,0.75)_45%,rgba(10,43,38,0.96)_80%,#0a2b26_100%)] lg:bg-[linear-gradient(160deg,rgba(15,61,54,0.55)_0%,rgba(15,61,54,0.80)_50%,rgba(10,43,38,0.97)_100%)]"
      />

      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center lg:px-16">
        <Link href="/bienvenue" aria-label="DigiWomen School — accueil" className="rounded-lg">
          <Image src={logoCreme} alt="DigiWomen School — La femme digitale" priority className="h-auto w-56 sm:w-64 xl:w-72" />
        </Link>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.3em] text-sand-light/85">DIWAA Finance</p>
        <p className="mt-6 text-lg italic text-sand-light/85 xl:text-xl">Apprendre • Innover • Réussir</p>
        {children}
      </div>

      <p className="hidden px-8 pb-8 text-center text-xs text-sand-light/60 lg:block">
        Outil interne de gestion financière de DigiWomen School
      </p>
    </section>
  );
}

/** En-tête photo + logo des pages de formulaire, sur téléphone et tablette uniquement. */
function MobileHeader() {
  return (
    <header className="relative overflow-hidden rounded-b-[2rem] bg-sand-light shadow-[0_12px_24px_-12px_rgba(60,50,25,0.25)] lg:hidden">
      <div className="relative h-44 sm:h-56">
        <Image src={headerPhoto} alt="" fill priority sizes="100vw" className="object-cover grayscale-[40%]" />
        <div aria-hidden className="absolute inset-0 bg-pine-800/45" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-b from-transparent to-sand-light" />
      </div>
      <div className="relative -mt-20 flex flex-col items-center px-6 pb-2">
        <Link href="/bienvenue" aria-label="DigiWomen School — accueil" className="rounded-lg">
          <Image src={logo} alt="DigiWomen School — La femme digitale" priority className="h-auto w-44 sm:w-52" />
        </Link>
        <p className="mt-1 text-sm text-zinc-500">DIWAA Finance</p>
      </div>
    </header>
  );
}

/** Onglets Connexion / Créer un compte. */
export function AuthTabs({ current }: { current: "connexion" | "creer-compte" }) {
  const tabs = [
    { key: "connexion", href: "/connexion", label: "Connexion" },
    { key: "creer-compte", href: "/creer-compte", label: "Créer un compte" },
  ] as const;
  return (
    <nav aria-label="Accès au compte" className="grid grid-cols-2 border-b border-sand-dark">
      {tabs.map((tab) => {
        const active = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "-mb-px border-b-[3px] px-2 pb-3 pt-2 text-center text-sm font-semibold transition-colors sm:text-base",
              active ? "border-pine-800 text-pine-900" : "border-transparent text-zinc-500 hover:text-pine-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Mise en page des formulaires d'entrée, pensée mobile d'abord :
 * - téléphone / tablette : en-tête photo + logo, formulaire centré dessous ;
 * - ordinateur (≥ 1024 px) : panneau photo fixe à gauche, formulaire à droite.
 * Aucune hauteur imposée : la page défile si l'écran est petit.
 */
export function AuthLayout({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh bg-sand-light lg:grid lg:grid-cols-2 xl:grid-cols-[1.1fr_1fr]">
      <HeroPanel className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh" />
      <div className="flex min-h-dvh flex-col">
        <MobileHeader />
        <main
          id="contenu"
          className={cx(
            "mx-auto flex w-full flex-1 flex-col px-6 pb-10 pt-6 sm:px-10 lg:justify-center lg:px-12 lg:py-16",
            wide ? "max-w-xl" : "max-w-md",
          )}
        >
          {children}
        </main>
        <p className="px-6 pb-6 text-center text-xs text-zinc-500 lg:hidden">Outil interne de DigiWomen School</p>
      </div>
    </div>
  );
}
