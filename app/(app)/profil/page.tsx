import type { Metadata } from "next";
import { BadgeCheck, Briefcase, CalendarDays, Mail, Phone } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { ROLE_LABELS, type Role } from "@/lib/authz/policy";
import { getOwnProfile } from "@/lib/services/profile";
import { Card, CardHeader, IconTile, PageHeader } from "@/components/ui/primitives";
import { AvatarUploader } from "./avatar-uploader";

export const metadata: Metadata = { title: "Mon profil" };

const formatDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Africa/Libreville" });

export default async function ProfilPage() {
  const actor = await requirePermission("profile.manageOwn");
  const profile = await getOwnProfile(actor);

  const rows = [
    { icon: Mail, label: "Identifiant (e-mail)", value: profile.email },
    { icon: BadgeCheck, label: "Profil d'accès", value: ROLE_LABELS[profile.role as Role] },
    { icon: Briefcase, label: "Poste / fonction", value: profile.jobTitle },
    { icon: Phone, label: "Téléphone", value: profile.phone },
    { icon: CalendarDays, label: "Compte créé le", value: formatDate.format(profile.createdAt) },
  ];

  return (
    <>
      <PageHeader title="Mon profil" description="Votre photo et les informations de votre compte DIWAA Finance." />

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <Card className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-pine-800">
            <div className="bg-dots absolute inset-0 text-white/[0.07]" />
          </div>
          <div className="relative pt-8">
            <AvatarUploader name={profile.name} image={profile.image} />
            <p className="mt-6 text-center text-lg font-bold">{profile.name}</p>
            <p className="text-center text-sm text-zinc-500">{ROLE_LABELS[profile.role as Role]}</p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Informations du compte"
            subtitle="Pour modifier votre profil d'accès, contactez l'administrateur général."
          />
          <dl className="divide-y divide-line">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 py-3.5">
                <IconTile>
                  <Icon className="size-5" strokeWidth={1.75} />
                </IconTile>
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-zinc-500">{label}</dt>
                  <dd className="truncate text-[15px] font-medium">{value || <span className="text-zinc-400">Non renseigné</span>}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
