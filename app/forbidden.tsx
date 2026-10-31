import Link from "next/link";
import { Lock } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="grid min-h-[60dvh] place-items-center p-4">
      <div className="max-w-sm text-center">
        <Lock aria-hidden className="mx-auto size-10 text-muted" />
        <h1 className="mt-4 text-xl font-bold">Accès non autorisé</h1>
        <p className="mt-2 text-sm text-muted">
          Votre profil ne permet pas d&apos;accéder à cette page. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur,
          contactez l&apos;administrateur général.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-brand-700 underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
