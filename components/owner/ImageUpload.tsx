"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { cloudinaryReady, uploadToCloudinary } from "@/lib/cloudinary";
import { Alert, Spinner } from "../ui";

/** Uploads straight to Cloudinary (unsigned preset, direct fetch) and hands back the secure URL. */
export function ImageUpload({
  label,
  hint,
  value,
  onChange,
  shape = "wide",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  shape?: "wide" | "square";
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("Choose an image file (JPG, PNG or WebP).");
    if (file.size > 5 * 1024 * 1024) return setError("That image is over 5 MB. Choose a smaller one.");
    setBusy(true);
    try {
      const res = await uploadToCloudinary(file, "image", "laundrypadi/shops");
      onChange(res.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="label">{label} <span className="font-normal text-ink-soft">(optional)</span></p>
      <div className="flex items-center gap-4">
        <div className={`relative shrink-0 overflow-hidden rounded-lg border border-line bg-canvas ${shape === "square" ? "h-20 w-20" : "h-20 w-32"}`}>
          {value ? <Image src={value} alt={`${label} preview`} fill sizes="128px" className="object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-ink-soft"><ImagePlus aria-hidden="true" className="h-6 w-6" /></span>}
          {busy && <span className="absolute inset-0 flex items-center justify-center bg-white/80"><Spinner /></span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={id} className={`btn btn-outline btn-sm cursor-pointer ${!cloudinaryReady ? "pointer-events-none opacity-50" : ""}`}>
            {value ? "Change" : "Upload"}
          </label>
          <input id={id} type="file" accept="image/*" className="sr-only" disabled={!cloudinaryReady || busy} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          {value && (
            <button type="button" onClick={() => onChange("")} className="inline-flex h-10 items-center gap-1.5 rounded px-2 text-sm font-semibold text-ink-soft hover:text-danger"><Trash2 aria-hidden="true" className="h-4 w-4" />Remove</button>
          )}
        </div>
      </div>
      {hint && <p className="field-hint">{hint}</p>}
      {!cloudinaryReady && <p className="field-hint">Image uploads need your Cloudinary keys in .env.local.</p>}
      {error && <div className="mt-2"><Alert>{error}</Alert></div>}
    </div>
  );
}
