import { v2 as cloudinary } from "cloudinary";

export function buildCloudinaryImageUrl({
  publicId,
  deliveryType = "upload",
  version = null
}) {
  if (!publicId) return null;

  const options = {
    secure: true,
    resource_type: "image",
    type: deliveryType
  };

  if (version) {
    options.version = version;
  }

  return cloudinary.url(publicId, options);
}