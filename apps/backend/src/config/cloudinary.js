import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

// MED-003: enforced folder + size/format presets per entity type.
// Actual size/format limits are also enforced client-side and via
// Cloudinary upload presets configured in the dashboard.
export const MEDIA_FOLDERS = Object.freeze({
  PROFILE_PHOTO: 'profile_photos',
  RALLY_PHOTO: 'rally_photos',
  BOOTH_REPORT: 'booth_reports',
  MANIFESTO_ASSET: 'manifesto_assets',
});

/**
 * MED-001/002: generate a short-lived signature so the frontend can upload
 * directly to Cloudinary without the file ever touching our Node server.
 */
export function generateUploadSignature({ folder, publicIdPrefix }) {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    timestamp,
    folder,
    ...(publicIdPrefix ? { public_id: publicIdPrefix } : {}),
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    folder,
    ...(publicIdPrefix ? { publicId: publicIdPrefix } : {}),
  };
}

/**
 * MED-004: remove an asset from Cloudinary (called on entity delete, or by
 * the weekly orphan-cleanup job).
 */
export async function destroyAsset(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
