import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = new Set(["/bienvenue", "/connexion", "/creer-compte"]);

/**
 * Contrôle optimiste uniquement : sans cookie de session, la racine mène à
 * l'écran d'accueil et toute autre page à la connexion. La vérification réelle
 * (session valide, compte actif, permissions) est faite côté serveur par
 * lib/auth/session.ts et lib/authz.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname) || getSessionCookie(request)) return NextResponse.next();

  if (pathname === "/") return NextResponse.redirect(new URL("/bienvenue", request.url));
  const url = new URL("/connexion", request.url);
  url.searchParams.set("suite", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Exclut l'API d'auth, les ressources statiques et les fichiers publics.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
