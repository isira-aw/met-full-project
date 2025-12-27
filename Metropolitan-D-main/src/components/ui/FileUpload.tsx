import React, { useRef, useState } from 'react';
import { Upload, X, File as FileIcon, Download } from 'lucide-react';
import Button from './Button';

export interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  currentFile?: {
    name: string;
    url?: string;
  };
  onDownload?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx',
  maxSize = 10, // 10MB default
  currentFile,
  onDownload,
  onRemove,
  disabled = false,
  label,
  helperText,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const displayFile = selectedFile || currentFile;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {!displayFile && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled}
          />

          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-blue-600">Click to upload</span> or
            drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {accept.split(',').join(', ')} (max {maxSize}MB)
          </p>
        </div>
      )}

      {displayFile && (
        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <FileIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile ? selectedFile.name : currentFile?.name}
              </p>
              {selectedFile && (
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {currentFile && onDownload && !selectedFile && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onDownload}
                type="button"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}

            {((selectedFile && !disabled) || (currentFile && onRemove)) && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  if (selectedFile) {
                    handleRemoveFile();
                  } else if (onRemove) {
                    onRemove();
                  }
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default FileUpload;
