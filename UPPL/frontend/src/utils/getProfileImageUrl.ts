import { BASE_URL } from "../config";

const FALLBACK = "/placeholder.svg";

type ImageInput = string | null | undefined | { url?: string; secure_url?: string };

export const getProfileImageUrl = (path: ImageInput): string => {
  if (!path) return FALLBACK;

  // Cloudinary object
  if (typeof path === "object") {
    return path.secure_url || path.url || FALLBACK;
  }

  // String
  if (typeof path === "string") {
    // Already a bundled asset
    if (path.startsWith("/src/") || path.includes("/assets/")) return path;
    if (path.startsWith("http")) return path;

    // Legacy local path
    let clean = path
      .replace(/\\/g, "/")
      .replace(/\/+/g, "/")
      .replace(/^uploads\//, "/uploads/");
    if (!clean.startsWith("/")) clean = "/" + clean;
    return `${BASE_URL}${clean}`;
  }

  return FALLBACK;
};

export default getProfileImageUrl;
