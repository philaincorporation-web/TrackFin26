import sharp from "sharp";
import { BusinessError } from "@/lib/errors";

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_SIZE = 256;

/** Formats acceptés, reconnus par leur signature (le type MIME envoyé n'est pas fiable). */
export function sniffImageType(buf: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => buf[i] === b)) return "png";
  if (
    buf.length >= 12 &&
    String.fromCharCode(...buf.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...buf.subarray(8, 12)) === "WEBP"
  )
    return "webp";
  return null;
}

/**
 * Normalise une photo de profil : vérifie taille et format, applique
 * l'orientation EXIF, recadre en carré 256 px et réencode en WebP. Le
 * réencodage supprime toutes les métadonnées (GPS, appareil…) et neutralise
 * tout contenu inattendu caché dans le fichier d'origine.
 */
export async function normalizeAvatar(input: Uint8Array): Promise<{ data: Uint8Array<ArrayBuffer>; mimeType: "image/webp" }> {
  if (input.length === 0) throw new BusinessError("Le fichier est vide.");
  if (input.length > AVATAR_MAX_BYTES) throw new BusinessError("La photo dépasse 5 Mo.");
  if (!sniffImageType(input)) throw new BusinessError("Format non pris en charge : utilisez une photo JPEG, PNG ou WebP.");

  try {
    const data = await sharp(input, { limitInputPixels: 50_000_000, failOn: "error" })
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
    return { data: new Uint8Array(data), mimeType: "image/webp" };
  } catch {
    throw new BusinessError("Cette image est illisible ou endommagée. Essayez une autre photo.");
  }
}
