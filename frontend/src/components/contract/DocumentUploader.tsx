"use client";

/**
 * DocumentUploader Component
 *
 * A drag-and-drop file upload component for contract documents.
 * Supports PDF, DOCX, and TXT files with client-side validation.
 *
 * @module components/contract/DocumentUploader
 */
import { useState, useCallback } from "react";
import { UploadCloud, FileText, Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Maximum file size in bytes (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed file extensions */
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

/** Allowed MIME types for uploaded files */
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

/**
 * Props for the DocumentUploader component.
 */
interface DocumentUploaderProps {
  /** Callback fired when a valid file is selected */
  onUpload: (file: File) => void;
}

/**
 * Validates a file against allowed types and size constraints.
 *
 * Validation order (from most fundamental to least):
 * 1. Empty file check - most basic validation
 * 2. File extension check - prevents processing unsupported formats
 * 3. MIME type check - additional security layer
 * 4. File size check - prevents DoS from large files
 *
 * @param file - The file to validate
 * @returns Error message if invalid, null if valid
 */
function validateFile(file: File): string | null {
  // Check for empty file first (most fundamental check)
  if (file.size === 0) {
    return "File is empty";
  }

  // Check file extension before processing
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
  }

  // Check MIME type (if browser provides it)
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Invalid file type: ${file.type}`;
  }

  // Check file size last (after confirming it's a valid file type)
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }

  return null;
}

/**
 * DocumentUploader - Drag-and-drop file upload component.
 *
 * Provides a user-friendly interface for uploading contract documents
 * with drag-and-drop support and file type validation.
 *
 * @param props - Component props
 * @param props.onUpload - Callback fired when a valid file is selected
 *
 * @example
 * ```tsx
 * <DocumentUploader onUpload={(file) => handleUpload(file)} />
 * ```
 */
export function DocumentUploader({ onUpload }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles drag events for the drop zone.
   */
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  /**
   * Processes a selected file, validating and triggering upload.
   */
  const processFile = useCallback(
    (selectedFile: File) => {
      setError(null);

      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      onUpload(selectedFile);
    },
    [onUpload]
  );

  /**
   * Handles file drop events.
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  /**
   * Handles file input change events.
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  /**
   * Clears the currently selected file.
   */
  const clearFile = useCallback(() => {
    setFile(null);
    setError(null);
  }, []);

  /**
   * Formats a file size in bytes to a human-readable string.
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div
      className={cn(
        "relative flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors duration-200",
        isDragging
          ? "border-blue-500 bg-blue-500/5"
          : "border-slate-600 hover:border-slate-500 bg-slate-800/30"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      role="region"
      aria-label="Document upload area"
    >
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 cursor-pointer opacity-0 z-10"
        onChange={handleChange}
        accept=".pdf,.docx,.txt"
        aria-label="Upload contract document (PDF, DOCX, or TXT)"
      />

      {file ? (
        <div className="flex flex-col items-center text-center px-4">
          {/* Success Icon */}
          <div className="rounded-2xl p-5 bg-emerald-600">
            <Check className="h-8 w-8 text-white" />
          </div>

          {/* File Info */}
          <div className="mt-6 flex items-center gap-3 rounded-xl px-5 py-3 border border-slate-600 bg-slate-800/50">
            <FileText className="h-5 w-5 text-blue-400" />
            <div className="text-left">
              <p className="font-medium text-white truncate max-w-[200px]">
                {file.name}
              </p>
              <p className="text-xs text-slate-400">
                {formatFileSize(file.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-2 hover:bg-rose-500/10 hover:text-rose-400 focus-ring"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              aria-label="Remove uploaded file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="mt-4 text-sm font-medium text-emerald-400">
            Ready to analyze!
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center px-4">
          {/* Upload Icon */}
          <div
            className={cn(
              "rounded-2xl p-5 transition-colors duration-200",
              isDragging ? "bg-blue-600" : "bg-violet-600"
            )}
          >
            <UploadCloud className="h-8 w-8 text-white" />
          </div>

          {/* Text */}
          <h3 className="mt-6 text-lg font-semibold text-white">
            {isDragging ? "Drop your file here" : "Upload your contract"}
          </h3>
          <p className="mt-2 text-sm text-slate-400 max-w-[250px]">
            Drag & drop your document or click to browse files
          </p>

          {/* File Types */}
          <div className="mt-5 flex gap-2">
            {["PDF", "DOCX", "TXT"].map((type) => (
              <span
                key={type}
                className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-600 bg-slate-800/50 text-slate-400"
              >
                {type}
              </span>
            ))}
          </div>

          {/* Size Limit */}
          <p className="mt-4 text-xs text-slate-400">
            Maximum file size: 10 MB
          </p>

          {/* Error Message */}
          {error && (
            <div
              className="mt-4 flex items-center gap-2 rounded-lg px-4 py-2 bg-rose-500/10 border border-rose-500/20"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
