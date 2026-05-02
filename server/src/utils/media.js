const { Readable } = require("stream");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

const uploadToCloudinary = async (file) => {
  if (!isCloudinaryConfigured()) {
    const error = new Error("Cloudinary is not configured");
    error.statusCode = 500;
    throw error;
  }

  const resourceType = file.mimetype.startsWith("video/") ? "video" : "image";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "prochat",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve({
          type: resourceType,
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
          originalName: file.originalname,
        });
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

module.exports = { uploadToCloudinary };
