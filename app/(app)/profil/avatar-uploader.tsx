"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { FormMessage } from "@/components/ui/primitives";
import { removeAvatarAction, updateAvatarAction } from "./actions";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export function AvatarUploader({ name, image }: { name: string; image: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    if (file.size > MAX_BYTES) {
      setMessage({ tone: "error", text: "La photo dépasse 5 Mo. Choisissez une image plus légère." });
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    const formData = new FormData();
    formData.set("photo", file);
    startTransition(async () => {
      const result = await updateAvatarAction(formData);
      setPreview(null);
      URL.revokeObjectURL(localUrl);
      setMessage(
        result.ok
          ? { tone: "success", text: "Photo de profil mise à jour." }
          : { tone: "error", text: result.error },
      );
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const onRemove = () => {
    if (!window.confirm("Retirer votre photo de profil ?")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await removeAvatarAction();
      setMessage(result.ok ? { tone: "success", text: "Photo retirée." } : { tone: "error", text: result.error });
    });
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <Avatar name={name} src={preview ?? image} size="xl" className="ring-4 ring-surface shadow-lg" />
        {pending && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40" aria-hidden>
            <LoaderCircle className="size-8 animate-spin text-white" />
          </span>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          aria-label="Changer la photo de profil"
          className="absolute -bottom-1 -right-1 grid size-10 place-items-center rounded-full bg-pine-800 text-white shadow-md ring-4 ring-surface hover:bg-pine-900 disabled:opacity-60"
        >
          <Camera aria-hidden className="size-5" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-pine-800 px-5 text-sm font-semibold text-white hover:bg-pine-900 disabled:opacity-60"
        >
          <Camera aria-hidden className="size-4" />
          {image ? "Changer la photo" : "Ajouter une photo"}
        </button>
        {image && (
          <button
            type="button"
            onClick={onRemove}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-zinc-700 hover:bg-canvas-soft disabled:opacity-60"
          >
            <Trash2 aria-hidden className="size-4" />
            Retirer
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-zinc-500">JPEG, PNG ou WebP · 5 Mo maximum · recadrée en carré</p>

      {message && (
        <div className="mt-4 w-full text-left">
          <FormMessage tone={message.tone}>{message.text}</FormMessage>
        </div>
      )}
    </div>
  );
}
