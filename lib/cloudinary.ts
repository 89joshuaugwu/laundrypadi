/**
 * Cloudinary helpers. Uploads use a direct fetch to the unsigned-preset endpoint,
 * never the SDK. Use resourceType "auto" for documents and receipts.
 */
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

export const cloudinaryReady = Boolean(cloudName && uploadPreset);

export interface UploadResult {
  publicId: string;
  url: string;
  width?: number;
  height?: number;
}

export async function uploadToCloudinary(
  file: File,
  resourceType: "image" | "raw" | "video" | "auto" = "image",
  folder = "laundrypadi",
): Promise<UploadResult> {
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary is not configured.");
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  form.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed. Please try again.");
  const data = (await res.json()) as { public_id: string; secure_url: string; width?: number; height?: number };
  return { publicId: data.public_id, url: data.secure_url, width: data.width, height: data.height };
}

/** Optimised delivery URL (auto format + quality) for an image already in Cloudinary. */
export function cloudinaryImage(publicId: string, width = 1200): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width},c_limit/${publicId}`;
}
