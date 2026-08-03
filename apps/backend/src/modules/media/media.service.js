import { generateUploadSignature, MEDIA_FOLDERS } from '../../config/cloudinary.js';
import { ApiError } from '../../utils/responseFormatter.js';

const FOLDER_BY_ENTITY = {
  profile_photo: MEDIA_FOLDERS.PROFILE_PHOTO,
  rally_photo: MEDIA_FOLDERS.RALLY_PHOTO,
  booth_report: MEDIA_FOLDERS.BOOTH_REPORT,
  manifesto_asset: MEDIA_FOLDERS.MANIFESTO_ASSET,
};

/**
 * MED-001/005: scopes the upload folder per entity type AND per user, so
 * Cloudinary storage mirrors ownership (`/{env}/{userId}/{entityType}/...`).
 */
export function createSignedUpload(userId, entityType) {
  const folder = FOLDER_BY_ENTITY[entityType];
  if (!folder) throw new ApiError(400, `Unknown media entity type: ${entityType}`);

  const scopedFolder = `${process.env.NODE_ENV || 'development'}/${userId}/${folder}`;
  return generateUploadSignature({ folder: scopedFolder });
}
