import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Database, LayoutGrid, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { can, ROLE_LABELS } from "@/lib/authz/policy";
import { NAVIGATION } from "@/lib/navigation";
import { Badge, Card, CardHeader, IconTile, PageHeader, cx } from "@/components/ui/primitives";
import { NAV_ICONS } from "@/components/shell/nav-icons";

export const metadata: Metadata = { title: "Accueil" };

export default async function HomePage() {
  // Session absente ou périmée (ancien cookie) : retour à l'écran de bienvenue, pas à la connexion.
  const user = await getCurrentUser();
  if (!user) redirect("/bienvenue");

  const modules = NAVIGATION.flatMap((s) => s.items).filter(
    (item) => item.href !== "/" && (!item.action || can(user, item.action)),
  );
  const available = modules.filter((m) => m.available).length;

  return (
    <>
      <PageHeader
        title={`Bonjour, ${user.name.split(" ")[0]}`}
        description="Voici votre espace DIWAA Finance pour DigiWomen School."
      />

      {/* Cartes de synthèse : uniquement des informations réelles, aucun chiffre simulé. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card tone="dark" className="relative overflow-hidden">
          <div aria-hidden className="bg-dots absolute inset-y-0 right-0 w-1/2 text-white/[0.07]" />
          <div className="relative">
            <IconTile tone="dark">
              <ShieldCheck className="size-6" strokeWidth={1.75} />
            </IconTile>
            <p className="mt-5 text-sm text-white/75">Votre profil d&apos;accès</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{ROLE_LABELS[user.role]}</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div aria-hidden className="bg-dots absolute inset-y-0 right-0 w-1/2 text-zinc-900/[0.05]" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <IconTile>
                <LayoutGrid className="size-6" strokeWidth={1.75} />
              </IconTile>
              <Badge tone="success">Bêta</Badge>
            </div>
            <p className="mt-5 text-sm text-zinc-500">Modules disponibles</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{available}</span>
              <span className="text-sm text-zinc-500">sur {modules.length} prévus pour votre profil</span>
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden sm:col-span-2 xl:col-span-1">
          <div aria-hidden className="bg-dots absolute inset-y-0 right-0 w-1/2 text-zinc-900/[0.05]" />
          <div className="relative">
            <IconTile>
              <Database className="size-6" strokeWidth={1.75} />
            </IconTile>
            <p className="mt-5 text-sm text-zinc-500">Données financières</p>
            <p className="mt-1 text-xl font-bold tracking-tight">Aucune opération saisie</p>
            <p className="mt-1 text-sm text-zinc-500">Les indicateurs apparaîtront dès les premières écritures réelles.</p>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Vos modules" subtitle="Les modules s'ouvrent au fil des livraisons de la version bêta." />
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const content = (
              <>
                <IconTile>
                  <Icon className="size-5" strokeWidth={1.75} />
                </IconTile>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{item.label}</span>
                  <span className="mt-1 block">
                    <Badge tone={item.available ? "success" : "neutral"}>{item.available ? "Disponible" : "Bientôt"}</Badge>
                  </span>
                </span>
                {item.available && <ArrowUpRight aria-hidden className="size-5 text-zinc-400" />}
              </>
            );
            const className = cx(
              "flex items-center gap-4 rounded-2xl border border-line p-4",
              item.available ? "transition-colors hover:border-pine-700/40 hover:bg-canvas-soft" : "opacity-75",
            );
            return (
              <li key={item.href}>
                {item.available ? (
                  <Link href={item.href} className={className}>
                    {content}
                  </Link>
                ) : (
                  <div className={className}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
