import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

/**
 * Photo de profil, réservée aux utilisateurs connectés (les photos sont des
 * données personnelles : elles ne sont jamais publiques). L'URL contient une
 * version (?v=…) changée à chaque mise à jour, d'où un cache long mais privé.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/avatar/[userId]">) {
  const viewer = await getCurrentUser();
  if (!viewer) return new Response(null, { status: 401 });

  const { userId } = await ctx.params;
  const avatar = await db.userAvatar.findUnique({ where: { userId }, select: { data: true, mimeType: true } });
  if (!avatar) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(avatar.data), {
    headers: {
      "Content-Type": avatar.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
