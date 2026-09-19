"use client";

import React, { useState, useTransition } from "react";
import {
  Upload,
  Image as ImageIcon,
  Check,
  Copy,
  Trash2,
  Edit2,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Loader2,
  HardDrive,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import {
  MediaAssetDTO,
  uploadAndOptimizeMediaAction,
  updateMediaAltTextAction,
  deleteMediaAction,
} from "@/actions/media.actions";

interface Props {
  initialAssets: MediaAssetDTO[];
  totalCount: number;
  totalSavedBytes: number;
  dbReady: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function MediaLibraryClient({
  initialAssets,
  totalCount,
  totalSavedBytes,
  dbReady,
}: Props) {
  const [assets, setAssets] = useState<MediaAssetDTO[]>(initialAssets);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("ALL");
  const [preferredFormat, setPreferredFormat] = useState<"webp" | "avif">("webp");

  // Alt text inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAltText, setEditAltText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadMessage(null);
    setUploadErrors([]);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    formData.append("format", preferredFormat);

    try {
      const res = await uploadAndOptimizeMediaAction(formData);
      if (res.success && res.assets) {
        setAssets((prev) => [...res.assets!, ...prev]);
        setUploadMessage(res.message);
        if (res.errors) setUploadErrors(res.errors);
      } else {
        setUploadMessage(res.message || "अपलोड अयशस्वी.");
        if (res.errors) setUploadErrors(res.errors);
      }
    } catch {
      setUploadMessage("इमेज अपलोड करताना तांत्रिक त्रुटी आली.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleCopyUrl = (id: string, url: string) => {
    const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveAlt = async (id: string) => {
    startTransition(async () => {
      await updateMediaAltTextAction(id, editAltText);
      setAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, altText: editAltText } : a))
      );
      setEditingId(null);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("तुम्हाला नक्की ही इमेज डिलीट करायची आहे का?")) return;
    startTransition(async () => {
      await deleteMediaAction(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
    });
  };

  const filteredAssets = assets.filter((a) => {
    const matchesQuery =
      !searchQuery.trim() ||
      a.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.altText && a.altText.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFormat =
      selectedFormat === "ALL" || a.format.toLowerCase() === selectedFormat.toLowerCase();

    return matchesQuery && matchesFormat;
  });

  return (
    <div className="space-y-6 font-marathi">
      {/* Upload & Drag Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragging
            ? "border-red-600 bg-red-50/50 dark:bg-red-950/20 scale-[1.01]"
            : "border-gray-300 hover:border-gray-400 bg-white"
        }`}
      >
        <input
          type="file"
          id="media-file-input"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFilesUpload(e.target.files);
          }}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 flex items-center justify-center text-red-700 shadow-xs">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>

          <div>
            <h3 className="text-base font-black text-gray-900">
              फोटो येथे ड्रॅग & ड्रॉप करा किंवा निवडा
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Sharp द्वारे स्वयंचलित इमेज कॉम्प्रेशन (WebP / AVIF) • कमाल आकार 25MB
            </p>
          </div>

          {/* Preferred Format Switcher */}
          <div className="inline-flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">
            <span>ऑप्टिमायझेशन फॉरमॅट:</span>
            <button
              type="button"
              onClick={() => setPreferredFormat("webp")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                preferredFormat === "webp"
                  ? "bg-white text-red-800 shadow-xs"
                  : "hover:text-gray-900"
              }`}
            >
              ⚡ WebP (शिफारस केलेले)
            </button>
            <button
              type="button"
              onClick={() => setPreferredFormat("avif")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                preferredFormat === "avif"
                  ? "bg-white text-red-800 shadow-xs"
                  : "hover:text-gray-900"
              }`}
            >
              🚀 AVIF (अल्ट्रा कॉम्पॅक्ट)
            </button>
          </div>

          <div>
            <label
              htmlFor="media-file-input"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm ${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-800 hover:bg-red-700"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>इमेज ऑप्टिमाइझ होत आहे...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>कॉम्प्युटरवरून फोटो निवडा</span>
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Upload Feedback */}
      {uploadMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {uploadErrors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-700" />
            <span>काही फाईल्स अपलोड करताना त्रुटी आली:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-gray-700">
            {uploadErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="नावाने किंवा Alt Text ने शोधा..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Format Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold whitespace-nowrap">
          {["ALL", "WEBP", "AVIF", "PNG", "JPEG"].map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedFormat === fmt
                  ? "bg-red-800 text-white border-red-800 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {fmt === "ALL" ? "सर्व फॉरमॅट्स" : fmt}
            </button>
          ))}
        </div>

        {/* Savings Metric */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-800">
          <HardDrive className="w-4 h-4 text-green-700" />
          <span>एकूण बँडविड्थ बचत: {formatBytes(totalSavedBytes)}</span>
        </div>
      </div>

      {/* Media Gallery Grid */}
      {filteredAssets.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-sm text-gray-700">कोणतेही फोटो आढळले नाहीत</p>
          <p className="text-xs text-gray-400 mt-1">
            नवीन फोटो अपलोड करण्यासाठी वरील बॉक्समध्ये इमेज ड्रॅग करा.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col justify-between group hover:border-red-700 transition-all"
            >
              {/* Image Preview & Badges */}
              <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                <img
                  src={asset.thumbnailUrl || asset.url}
                  alt={asset.altText || asset.originalName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Savings Pill */}
                {asset.savedPercent > 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-black rounded-full shadow-xs">
                    ⚡ {asset.savedPercent}% बचत
                  </div>
                )}

                {/* Format Pill */}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-950/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold uppercase rounded-md shadow-xs">
                  {asset.format}
                </div>
              </div>

              {/* Details */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4
                    className="text-xs font-bold text-gray-900 line-clamp-1"
                    title={asset.originalName}
                  >
                    {asset.originalName}
                  </h4>

                  {/* Size Comparison */}
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium mt-1">
                    <span className="line-through text-gray-400">
                      {formatBytes(asset.originalSize)}
                    </span>
                    <span>→</span>
                    <span className="font-bold text-emerald-700">
                      {formatBytes(asset.optimizedSize)}
                    </span>
                    {asset.width && asset.height && (
                      <span className="text-gray-400">
                        • {asset.width}×{asset.height}
                      </span>
                    )}
                  </div>

                  {/* Alt Text Display / Edit */}
                  {editingId === asset.id ? (
                    <div className="mt-2 space-y-1">
                      <input
                        type="text"
                        value={editAltText}
                        onChange={(e) => setEditAltText(e.target.value)}
                        placeholder="Alt text प्रविष्ट करा..."
                        className="w-full p-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
                        autoFocus
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveAlt(asset.id)}
                          className="px-2 py-1 bg-red-800 text-white rounded text-[10px] font-bold"
                        >
                          जतन करा
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px]"
                        >
                          रद्द
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-gray-600 mt-1.5 pt-1.5 border-t border-gray-100">
                      <span className="truncate italic max-w-[160px]">
                        Alt: {asset.altText || "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(asset.id);
                          setEditAltText(asset.altText || "");
                        }}
                        className="text-gray-400 hover:text-red-700 p-0.5"
                        title="Alt Text संपादित करा"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(asset.id, asset.url)}
                    className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-red-800 transition-colors"
                  >
                    {copiedId === asset.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">URL कॉपी झाली!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>URL कॉपी करा</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="नवीन टॅबमध्ये उघडा"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(asset.id)}
                      className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="हटवा"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

