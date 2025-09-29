import { BASE_URL } from "../config";

export const getProfileImageUrl = (path: string | null | { url?: string }) => {
  if (!path) {
    return `${BASE_URL}/uploads/teamMembers/default-avatar.png`; // fallback placeholder
  }

  // ✅ Case 1: Cloudinary object
  if (typeof path === "object" && path.url) {
    return path.url; // already full Cloudinary URL
  }

  // ✅ Case 2: string (could be cloudinary url or local path)
  if (typeof path === "string") {
    if (path.startsWith("http")) {
      return path; // Cloudinary or external URL
    }

    // legacy local path (normalize)
    let cleanPath = path
      .replace(/\\/g, "/")
      .replace(/\/+/g, "/")
      .replace(/^uploads\//, "/uploads/");

    if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
    return `${BASE_URL}${cleanPath}`;
  }

  return `${BASE_URL}/uploads/teamMembers/default-avatar.png`; // ultimate fallback
};

export default getProfileImageUrl;
