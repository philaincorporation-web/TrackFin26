import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthLayout, AuthTabs } from "@/components/auth/auth-layout";
import { SignupFlow } from "./signup-flow";

export const metadata: Metadata = { title: "Créer mon compte" };

export default function CreerComptePage() {
  return (
    <AuthLayout>
      <AuthTabs current="creer-compte" />
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <SignupFlow />
      </Suspense>
    </AuthLayout>
  );
}
