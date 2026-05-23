import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import path from "path";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function buildImagePublicId({ userId, contentType }) {
  const ext = MIME_TO_EXT[contentType];
  if (!ext) {
    throw new AppError("Unsupported image type", 400, "INVALID_FILE_TYPE");
  }

  const fileId = crypto.randomUUID();
  return `posts/${userId}/${fileId}.${ext}`;
}

export async function createImageUpload({
  userId,
  fileName,
  contentType,
  size,
  buffer,
}) {
  if (size > env.MAX_IMAGE_SIZE_BYTES) {
    throw new AppError("Image is too large", 400, "FILE_TOO_LARGE");
  }

  const publicId = buildImagePublicId({ userId, contentType });

  const uploaded = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: env.CLOUDINARY_FOLDER,
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });

  return {
    imageKey: uploaded.public_id,
    uploadUrl: uploaded.secure_url,
    publicId: uploaded.public_id,
    contentType,
    size,
    fileName: path.basename(fileName || "image"),
  };
}

export async function createSignedImageUrl(imageKey) {
  if (!imageKey) {
    throw new AppError("Image not found", 404, "NOT_FOUND");
  }

  return cloudinary.url(imageKey, {
    secure: true,
    resource_type: "image",
  });
}