"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { uploadAndOptimizeMediaAction } from "@/actions/media.actions";

interface FeaturedImageUploaderProps {
  initialImageUrl?: string | null;
  value?: string | null;
  onChange?: (url: string) => void;
  name?: string;
  label?: string;
  required?: boolean;
}

export default function FeaturedImageUploader({
  initialImageUrl = "",
  value,
  onChange,
  name = "featuredImage",
  label = "मुख्य बातमी फोटो (Featured News Image)",
  required = false,
}: FeaturedImageUploaderProps) {
  const [internalUrl, setInternalUrl] = useState<string>(initialImageUrl || "");
  const imageUrl = value !== undefined ? (value || "") : internalUrl;

  const setImageUrl = (url: string) => {
    setInternalUrl(url);
    if (onChange) onChange(url);
  };
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validate client-side size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("फोटोचा आकार २५ MB पेक्षा कमी असावा.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", "webp");

    try {
      const res = await uploadAndOptimizeMediaAction(formData);
      if (res.success && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setImageUrl(asset.url);
        setUploadSuccess(
          `फोटो ऑप्टिमाइझ करून जोडला! (${asset.format.toUpperCase()} • ${(asset.optimizedSize / 1024).toFixed(0)} KB)`
        );
        setTimeout(() => setUploadSuccess(null), 4000);
      } else {
        setUploadError(res.message || "इमेज अपलोड अयशस्वी झाली.");
      }
    } catch {
      setUploadError("फोटो अपलोड करताना तांत्रिक त्रुटी आली.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setUploadError(null);
    setUploadSuccess(null);
  };

  return (
    <div className="space-y-2">
      {/* Label and Mode Switch */}
      <div className="flex items-center justify-between">
        <label className="block font-bold text-gray-900 text-xs sm:text-sm">
          {label} {required && <span className="text-red-700">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[11px] font-semibold text-gray-500 hover:text-red-800 transition-colors inline-flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showManualUrl ? "अपलोड मोड वापरा" : "किंवा थेट URL पेस्ट करा"}</span>
        </button>
      </div>

      {/* Hidden input for Form Submission */}
      <input type="hidden" name={name} value={imageUrl} />

      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files);
          }
        }}
      />

      {/* Preview Area (if image exists) */}
      {imageUrl ? (
        <div className="relative p-3 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-48 h-32 bg-gray-900/5 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="बातमी कव्हर फोटो"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2 w-full">
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>फोटो जोडला आहे</span>
                </span>
                {imageUrl.includes("/uploads/media/") && (
                  <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded flex items-center gap-1 text-[10px]">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Sharp Optimized</span>
                  </span>
                )}
              </div>

              <p className="text-[11px] text-gray-500 font-mono truncate max-w-full">
                {imageUrl}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? "animate-spin" : ""}`} />
                  <span>{isUploading ? "ऑप्टिमाइझ करत आहे..." : "फोटो बदला (Replace)"}</span>
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleRemoveImage}
                  className="inline-flex items-center gap-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>काढा (Remove)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Upload / Dropzone Area (if no image) */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-red-600 bg-red-50/50"
              : "border-gray-300 hover:border-red-600 hover:bg-gray-50/50"
          } ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <Loader2 className="w-8 h-8 text-red-700 animate-spin" />
              <p className="text-xs font-bold text-gray-900">
                इमेज Sharp द्वारे कॉम्प्रेस व ऑप्टिमाइझ होत आहे...
              </p>
              <p className="text-[11px] text-gray-500">
                WebP फॉरमॅट, ऑटो-ओरिएंटेशन व रिस्पॉन्सिव्ह थंबनेल जनरेशन सुरू आहे.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 bg-red-50 text-red-700 rounded-full flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">
                  बातमीसाठी कव्हर फोटो निवडा किंवा येथे ड्रॅग करा (Drag & Drop)
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  JPEG, PNG, WebP किंवा AVIF समर्थित • आपोआप हाय-स्पीड WebP मध्ये ऑप्टिमाइझ होईल
                </p>
              </div>
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1.5 bg-red-800 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-xs transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>संगणकातून फोटो निवडा</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual URL Input (Conditional) */}
      {showManualUrl && (
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
          <label className="block font-bold text-gray-700 text-xs">
            बाह्य इमेज URL पेस्ट करा (Direct Image URL):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value.trim())}
              placeholder="https://images.unsplash.com/... किंवा /uploads/media/..."
              className="flex-1 border border-gray-300 rounded-lg p-2 text-xs font-mono text-gray-900 focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
            {imageUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-3 py-2 rounded-lg text-xs transition-colors"
              >
                साफ करा
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload Messages & Errors */}
      {uploadSuccess && (
        <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold p-2 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs text-red-700 font-semibold p-2 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}

