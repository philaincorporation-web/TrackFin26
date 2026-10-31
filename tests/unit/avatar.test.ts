import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { AVATAR_MAX_BYTES, normalizeAvatar, sniffImageType } from "@/lib/avatar/process";
import { BusinessError } from "@/lib/errors";

const image = (format: "jpeg" | "png" | "webp", width = 800, height = 600) =>
  sharp({ create: { width, height, channels: 3, background: { r: 36, g: 115, b: 27 } } })
    .toFormat(format)
    .toBuffer()
    .then((b) => new Uint8Array(b));

describe("photo de profil", () => {
  it.each(["jpeg", "png", "webp"] as const)("reconnaît un %s par sa signature", async (format) => {
    expect(sniffImageType(await image(format))).toBe(format);
  });

  it("produit un WebP carré de 256 px", async () => {
    const { data, mimeType } = await normalizeAvatar(await image("jpeg", 1200, 800));
    const meta = await sharp(data).metadata();
    expect(mimeType).toBe("image/webp");
    expect([meta.format, meta.width, meta.height]).toEqual(["webp", 256, 256]);
  });

  it("supprime les métadonnées EXIF", async () => {
    const withExif = new Uint8Array(
      await sharp(await image("jpeg"))
        .withExif({ IFD0: { Make: "AppareilSecret", Copyright: "GPS-48.85" } })
        .jpeg()
        .toBuffer(),
    );
    expect((await sharp(withExif).metadata()).exif).toBeDefined();
    const { data } = await normalizeAvatar(withExif);
    expect((await sharp(data).metadata()).exif).toBeUndefined();
  });

  it("refuse un fichier qui n'est pas une image, même renommé", async () => {
    const pdf = new TextEncoder().encode("%PDF-1.7 faux document");
    await expect(normalizeAvatar(pdf)).rejects.toBeInstanceOf(BusinessError);
  });

  it("refuse une image corrompue", async () => {
    const broken = (await image("png")).slice(0, 40);
    await expect(normalizeAvatar(broken)).rejects.toThrow(/illisible/);
  });

  it("refuse un fichier trop lourd ou vide", async () => {
    await expect(normalizeAvatar(new Uint8Array(AVATAR_MAX_BYTES + 1))).rejects.toThrow(/5 Mo/);
    await expect(normalizeAvatar(new Uint8Array())).rejects.toThrow(/vide/);
  });
});
