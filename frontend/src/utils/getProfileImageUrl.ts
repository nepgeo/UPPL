import { BASE_URL } from "../config";

const getProfileImageUrl = (profileImage: any) => {
  if (!profileImage) return `${BASE_URL}/favicon.png`;

  if (typeof profileImage === "object" && profileImage.url) {
    return profileImage.url;
  }

  if (typeof profileImage === "string") {
    if (profileImage.startsWith("http")) return profileImage;

    let cleanPath = profileImage
      .replace(/\\/g, "/")
      .replace(/\/+/g, "/")
      .replace(/^\/uploads\/uploads\//, "/uploads/")
      .replace(/^uploads\//, "/uploads/");

    if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
    return `${BASE_URL}${cleanPath}`;
  }

  return `${BASE_URL}/favicon.png`;
};
