import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthLayout, AuthTabs } from "@/components/auth/auth-layout";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return (
    <AuthLayout>
      <AuthTabs current="connexion" />
      <div className="mt-8">
        <h1 className="text-2xl font-bold tracking-tight text-pine-900 sm:text-3xl">Bon retour parmi nous</h1>
        <p className="mt-1 text-sm text-zinc-600">Connectez-vous avec l&apos;adresse e-mail de votre compte.</p>
      </div>
      <div className="mt-8">
        <Suspense fallback={<div className="h-72" aria-hidden />}>
          <LoginForm />
        </Suspense>
      </div>
    </AuthLayout>
  );
}
