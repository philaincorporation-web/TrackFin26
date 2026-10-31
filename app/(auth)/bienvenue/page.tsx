import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleCheck } from "lucide-react";
import { HeroPanel } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Bienvenue" };

const POINTS = [
  "Déclarez vos dépenses et vos justificatifs depuis votre téléphone",
  "Suivez factures, encaissements et trésorerie en temps réel",
  "Consultez vos bulletins de paie en toute confidentialité",
];

export default function BienvenuePage() {
  return (
    <div className="min-h-dvh bg-sand-light lg:grid lg:grid-cols-2 xl:grid-cols-[1.1fr_1fr]">
      {/* Téléphone : écran d'accueil plein écran. Ordinateur : colonne gauche fixe. */}
      <HeroPanel className="min-h-dvh lg:sticky lg:top-0 lg:h-dvh">
        <h1 className="sr-only lg:hidden">Bienvenue sur DIWAA Finance</h1>
        <div className="mt-14 flex w-full max-w-xs flex-col gap-3 lg:hidden">
          <Link
            href="/connexion"
            className="inline-flex h-12 items-center justify-center rounded-full bg-sand-dark px-8 text-sm font-semibold uppercase tracking-wider text-pine-900 shadow-lg shadow-black/25 transition-colors hover:bg-sand-light"
          >
            Se connecter
          </Link>
          <Link
            href="/creer-compte"
            className="inline-flex h-12 items-center justify-center rounded-full border border-sand-light/60 px-8 text-sm font-semibold uppercase tracking-wider text-sand-light transition-colors hover:bg-sand-light/10"
          >
            Créer mon compte
          </Link>
          <p className="mt-2 text-xs text-sand-light/70">Création de compte sur invitation de l&apos;administrateur</p>
        </div>
      </HeroPanel>

      {/* Ordinateur : présentation et actions */}
      <main id="contenu" className="hidden flex-col justify-center px-12 py-16 lg:flex xl:px-20">
        <div className="max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pine-700">DigiWomen School</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-pine-900 xl:text-5xl">
            Bienvenue sur DIWAA Finance
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            L&apos;outil interne qui centralise les finances, les justificatifs et la paie de l&apos;école.
          </p>

          <ul className="mt-8 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-zinc-700">
                <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-pine-700" />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/connexion"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-pine-800 px-8 text-sm font-semibold uppercase tracking-wider text-sand-light shadow-lg shadow-pine-900/25 transition-colors hover:bg-pine-900"
            >
              Se connecter
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link
              href="/creer-compte"
              className="inline-flex h-12 items-center justify-center rounded-full border border-pine-800 px-8 text-sm font-semibold uppercase tracking-wider text-pine-900 transition-colors hover:bg-sand"
            >
              Créer mon compte
            </Link>
          </div>
          <p className="mt-6 text-sm text-zinc-500">
            Première connexion ? Utilisez le code d&apos;invitation transmis par l&apos;administrateur pour créer votre
            compte.
          </p>
        </div>
      </main>
    </div>
  );
}
