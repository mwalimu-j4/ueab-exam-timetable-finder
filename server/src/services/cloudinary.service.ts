import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function assertConfigured(): void {
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('[upload] Cloudinary configuration missing', {
      hasCloudName: Boolean(cloudName),
      hasApiKey: Boolean(apiKey),
      hasApiSecret: Boolean(apiSecret),
    });
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME (or CLOUDINARY_NAME), CLOUDINARY_API_KEY (or CLOUDINARY_KEY), and CLOUDINARY_API_SECRET (or CLOUDINARY_SECRET).'
    );
  }
}

export function uploadTimetablePdf(buffer: Buffer, name: string): Promise<UploadApiResponse> {
  assertConfigured();
  console.log('[upload] Cloudinary upload started', {
    bytes: buffer.length,
    fileName: name,
    folder: 'ueab-timetables',
  });

  const publicId = `timetable-${Date.now()}-${name
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'upload'}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ueab-timetables',
        public_id: publicId,
        resource_type: 'raw',
        type: 'upload',
        format: 'pdf',
        access_mode: 'public',
      },
      (error, result) => {
        if (error || !result) {
          console.error('[upload] Cloudinary upload failed', {
            message: error?.message || 'No upload result returned',
            httpCode: error?.http_code,
          });
          reject(new Error(`Cloudinary PDF upload failed: ${error?.message || 'No upload result returned'}`));
          return;
        }
        console.log('[upload] Cloudinary upload completed', {
          publicId: result.public_id,
          bytes: result.bytes,
          resourceType: result.resource_type,
        });
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

export async function deleteTimetablePdf(publicId: string): Promise<void> {
  assertConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', type: 'upload' });
}
