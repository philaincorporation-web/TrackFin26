import { Suspense } from "react";
import { AppSidebar, AppTopbar, SidebarSkeleton, TopbarSkeleton } from "@/components/shell/app-sidebar";

/**
 * Coquille de l'espace connecté. La session est lue uniquement derrière des
 * frontières <Suspense> (Cache Components) : ici pour la navigation et la
 * barre supérieure, et via loading.tsx pour chaque page.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh lg:flex lg:gap-6 lg:p-4">
      <Suspense fallback={<SidebarSkeleton />}>
        <AppSidebar />
      </Suspense>
      <main id="contenu" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-2 lg:py-4 xl:pr-4">
        <Suspense fallback={<TopbarSkeleton />}>
          <AppTopbar />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
