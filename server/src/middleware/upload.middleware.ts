import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { upload } from '../config/multer.config';

export function parseTimetableUpload(req: Request, res: Response, next: NextFunction): void {
  console.log('[upload] multipart request received', {
    method: req.method,
    path: req.originalUrl,
    contentType: req.get('content-type'),
    contentLength: req.get('content-length'),
  });

  upload.single('file')(req, res, (error: unknown) => {
    if (error) {
      console.error('[upload] multipart parsing failed', {
        error: error instanceof Error ? error.message : String(error),
        code: error instanceof multer.MulterError ? error.code : undefined,
      });
      next(error);
      return;
    }

    console.log('[upload] multipart parsing completed', {
      hasFile: Boolean(req.file),
      fileName: req.file?.originalname,
      mimeType: req.file?.mimetype,
      bytes: req.file?.size,
      fieldNames: Object.keys(req.body || {}),
    });
    next();
  });
}
