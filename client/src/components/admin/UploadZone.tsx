import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

interface UploadZoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFileAccepted, disabled }: UploadZoneProps) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    acceptedFiles,
    fileRejections,
  } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 15 * 1024 * 1024, // 15MB
    multiple: false,
    disabled,
    onDropAccepted: (files) => {
      if (files.length > 0) {
        onFileAccepted(files[0]);
      }
    },
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:border-gray-400'}
        `}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop the PDF here</p>
        ) : (
          <p className="text-gray-600">
            Drag and drop a PDF here, or click to browse
          </p>
        )}
      </div>

      {acceptedFiles.length > 0 && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm font-medium text-green-800">
            ✓ Selected: {acceptedFiles[0].name}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Size: {(acceptedFiles[0].size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="mt-2 text-sm text-red-600">
          {fileRejections[0].errors.map((error) => (
            <p key={error.code}>
              {error.code === 'file-too-large'
                ? 'File is too large. Maximum size is 15MB.'
                : error.code === 'file-invalid-type'
                ? 'Invalid file type. Only PDF files are accepted.'
                : error.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
