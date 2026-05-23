import crypto from "crypto";
import { cloudinary } from "../../config/cloudinary.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

function buildFolder(userId, visibility) {
  return `${env.CLOUDINARY_FOLDER}/users/${userId}/${visibility}`;
}

function buildPublicId(userId, visibility) {
  return `${buildFolder(userId, visibility)}/${Date.now()}-${crypto.randomUUID()}`;
}

function getDeliveryType(visibility) {
  return visibility === "private" ? "authenticated" : "upload";
}

export function createCloudinaryUploadSignature({ userId, fileName, contentType, size, visibility }) {
  if (size > env.MAX_IMAGE_SIZE_BYTES) {
    throw new AppError("Image is too large", 400, "FILE_TOO_LARGE");
  }

  const ext = MIME_TO_EXT[contentType];
  if (!ext) {
    throw new AppError("Only JPG, PNG, WEBP, or GIF images are allowed", 400, "INVALID_FILE_TYPE");
  }

  const folder = buildFolder(userId, visibility);
  const public_id = buildPublicId(userId, visibility);
  const type = getDeliveryType(visibility);
  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign = {
    timestamp,
    folder,
    public_id,
    type,
    resource_type: "image"
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    timestamp,
    signature,
    folder,
    publicId: public_id,
    deliveryType: type,
    resourceType: "image",
    maxImageSizeBytes: env.MAX_IMAGE_SIZE_BYTES,
    allowedContentTypes: Object.keys(MIME_TO_EXT),
    fileName: fileName.replace(/[^\w.\- ]+/g, "_")
  };
}

export function verifyCloudinaryUploadResult(upload) {
  const expectedSignature = cloudinary.utils.api_sign_request(
    {
      public_id: upload.publicId,
      version: upload.version
    },
    env.CLOUDINARY_API_SECRET
  );

  if (expectedSignature !== upload.signature) {
    throw new AppError("Invalid image upload", 400, "INVALID_IMAGE_UPLOAD");
  }

  return true;
}