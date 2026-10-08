import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, Trash2 } from 'lucide-react';

export function FileDropzone({
  onFilesSelected,
  acceptedFormats = ['.dcm', '.pdf', '.png', '.jpg', '.zip'],
  maxSizeMb = 50,
  files = [],
  onRemoveFile,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center ${
          isDragging
            ? 'border-[#FFE500] bg-[#FFE500]/10 ring-4 ring-[#FFE500]/20'
            : 'border-[#CBD5E1] dark:border-[#1B456E] hover:border-[#0A2540] dark:hover:border-[#FFE500] bg-white/60 dark:bg-[#0A2540]/60 hover:bg-[#F6F7FA]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept={acceptedFormats.join(',')}
        />

        <div className="p-3.5 rounded-2xl bg-[#0A2540] text-[#FFE500] mb-3 shadow-sm">
          <UploadCloud className="w-6 h-6" />
        </div>

        <p className="text-sm font-bold text-[#0A2540] dark:text-white">
          Drag & drop diagnostic scans, or <span className="text-[#B89C14] underline">browse files</span>
        </p>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-mono">
          Supports DICOM (.dcm), 12-Lead ECG (.png/.pdf), Lab bloodwork (.pdf) up to {maxSizeMb}MB
        </p>
      </div>

      {/* File queue items */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white dark:bg-[#0F355A] border border-[#E2E8F0] dark:border-[#1B456E] flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5 truncate">
                <File className="w-4 h-4 text-[#0A2540] dark:text-[#FFE500] shrink-0" />
                <span className="font-medium text-[#051A30] dark:text-white truncate">
                  {file.name}
                </span>
                <span className="text-[10px] text-[#64748B] font-mono shrink-0">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              {onRemoveFile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemoveFile(idx); }}
                  className="p-1 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
