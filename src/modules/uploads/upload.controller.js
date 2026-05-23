import { AppError } from "../../utils/AppError.js";
import { success } from "../../utils/response.js";
import { createCloudinaryUploadSignature, verifyCloudinaryUploadResult } from "./upload.service.js";
import { createUploadSignatureSchema, verifyCloudinaryImageSchema } from "./upload.validators.js";

export async function signImageUpload(req, res, next) {
  try {
    const parsed = createUploadSignatureSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400, "VALIDATION_ERROR");
    }

    const data = createCloudinaryUploadSignature({
      userId: req.user.id,
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
      size: parsed.data.size,
      visibility: parsed.data.visibility
    });

    return success(res, { upload: data }, null, 201);
  } catch (err) {
    next(err);
  }
}

export async function verifyImageUpload(req, res, next) {
  try {
    const parsed = verifyCloudinaryImageSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400, "VALIDATION_ERROR");
    }

    verifyCloudinaryUploadResult(parsed.data);

    return success(res, {
      image: {
        publicId: parsed.data.publicId,
        version: parsed.data.version,
        signature: parsed.data.signature,
        format: parsed.data.format ?? null,
        width: parsed.data.width ?? null,
        height: parsed.data.height ?? null,
        bytes: parsed.data.bytes ?? null,
        deliveryType: parsed.data.deliveryType
      }
    });
  } catch (err) {
    next(err);
  }
}