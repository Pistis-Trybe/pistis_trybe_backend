import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import config from ".";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME as string,
  api_key: config.CLOUDINARY_API_KEY as string,
  api_secret: config.CLOUDINARY_API_SECRET as string,
});

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  options: Record<string, any> = {}
): Promise<any> => {
  return new Promise((resolve, reject) => {
     // Detect if it's a video based on resource_type option or mimetype
    const resourceType = options.resource_type || "auto"; // "auto" lets Cloudinary detect

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId: string) => {
  return cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
