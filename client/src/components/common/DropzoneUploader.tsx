import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Eye, Download, Trash2 } from 'lucide-react';

export interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
}

interface DropzoneProps {
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  subLabel?: string;
  onFilesChanged?: (files: UploadedFileItem[]) => void;
}

export const DropzoneUploader: React.FC<DropzoneProps> = ({
  accept = 'image/*,application/pdf',
  maxSizeMB = 10,
  label = 'Drag and drop your documents or images here',
  subLabel = 'Supports PDF, PNG, JPG up to 10MB',
  onFilesChanged,
}) => {
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList) => {
    setError(null);
    const newFiles: UploadedFileItem[] = [];

    Array.from(fileList).forEach((file) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the ${maxSizeMB}MB limit.`);
        return;
      }

      const item: UploadedFileItem = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        status: 'completed',
      };
      newFiles.push(item);
    });

    const updated = [...files, ...newFiles];
    setFiles(updated);
    if (onFilesChanged) onFilesChanged(updated);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    if (onFilesChanged) onFilesChanged(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="space-y-4">
      {/* Dropzone Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
          isDragOver
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shadow-sm">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-xs text-slate-400 mt-1">{subLabel}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* File List Preview */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uploaded Files ({files.length})</p>
          <div className="grid grid-cols-1 gap-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate max-w-xs">{file.name}</p>
                    <p className="text-[10px] text-slate-400">{formatSize(file.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemove(file.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
