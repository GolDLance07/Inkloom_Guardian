'use client';

import React, { useState, useRef } from 'react';
import { Brand, AssetInspectionResult, AssetFinding } from '@/lib/types';
import { api } from '@/lib/api';

interface AssetInspectionViewProps {
  brand: Brand | null;
  onNavigateToKnowledge: () => void;
}

export const AssetInspectionView: React.FC<AssetInspectionViewProps> = ({
  brand,
  onNavigateToKnowledge,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [result, setResult] = useState<AssetInspectionResult | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/i)) {
      setErrorBanner('Please select a valid image (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorBanner('Image exceeds 10MB limit.');
      return;
    }

    setErrorBanner(null);
    setResult(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/i)) {
      setErrorBanner('Please drop a valid image (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorBanner('Image exceeds 10MB limit.');
      return;
    }

    setErrorBanner(null);
    setResult(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInspect = async () => {
    if (!brand) {
      setErrorBanner('Please select a brand workspace first.');
      return;
    }
    if (!selectedFile) {
      setErrorBanner('Please upload an image asset to inspect.');
      return;
    }

    try {
      setIsInspecting(true);
      setErrorBanner(null);
      const res = await api.inspectAssetImage(brand.id, selectedFile);
      setResult(res);
    } catch (err: any) {
      setErrorBanner(err.message || 'Asset inspection failed.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setResult(null);
    setErrorBanner(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <span className="material-symbols-outlined text-[36px] text-slate-400">
          image_not_supported
        </span>
        <span className="font-serif text-lg text-slate-700 font-semibold">
          No Brand Selected
        </span>
        <p className="text-sm text-slate-500">
          Select or create a brand workspace to inspect visual marketing assets.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pb-20">
      {/* View Header */}
      <div className="w-full bg-[#FAF8F5] border-b border-[#E8DFD0] px-8 py-5 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-bold text-[#0B132B]">
              Multi-Modal Asset Checking
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-crimson/10 text-crimson uppercase tracking-wider">
              OCR SCREENING
            </span>
          </div>
          <p className="font-sans text-xs text-[#64748B] mt-1">
            Extract copy from visual ads, banners, and collateral to evaluate against{' '}
            <strong className="text-[#0B132B]">{brand.name}</strong> policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-[#E0D7C3] font-mono text-[11px] text-[#64748B] shadow-xs">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            <span>BRAND: {brand.slug.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Advisory Notice Banner */}
      <div className="mx-8 mt-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
        <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">
          verified_user
        </span>
        <div className="flex-1">
          <p className="font-semibold text-amber-950 text-[13px]">
            Advisory Verification Framework
          </p>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            OCR text extraction screens plain text against brand knowledge. It does not verify typography, layout, font sizes, colors, or logo artwork. Findings are advisory and human verification remains necessary.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div className="mx-8 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-crimson text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-crimson hover:underline cursor-pointer font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Split */}
      <div className="w-full px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Asset Upload & Preview */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white rounded-xl p-6 border border-[#E5DDCB] sumi-card-shadow flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-crimson via-[#0B132B] to-transparent" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-crimson text-[22px]">
                  photo_library
                </span>
                <h2 className="font-serif text-xl font-bold text-[#0B132B]">
                  Asset Upload
                </h2>
              </div>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-slate-500 hover:text-crimson transition-colors font-medium cursor-pointer"
                >
                  Clear asset
                </button>
              )}
            </div>

            {/* Dropzone */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="asset-upload-input"
            />

            {!imagePreviewUrl ? (
              <label
                htmlFor="asset-upload-input"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[#D5CBB8] hover:border-crimson rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-[#FAF8F2] hover:bg-[#F5F0E6] transition-all cursor-pointer text-center group min-h-[260px]"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 group-hover:text-crimson transition-colors">
                  <span className="material-symbols-outlined text-[28px]">
                    cloud_upload
                  </span>
                </div>
                <div>
                  <p className="font-serif text-base font-bold text-[#0B132B]">
                    Drag & drop banner or ad image here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PNG, JPEG, and WebP (up to 10MB, max 4096px)
                  </p>
                </div>
                <span className="px-3 py-1 rounded-md bg-white border border-[#DDD4C0] text-xs font-semibold text-[#0B132B] shadow-xs group-hover:border-crimson">
                  Browse file
                </span>
              </label>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="relative rounded-xl overflow-hidden border border-[#E0D7C3] bg-[#FAF8F2] max-h-[360px] flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreviewUrl}
                    alt="Asset preview"
                    className="max-h-[340px] max-w-full object-contain rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 bg-[#FAF8F2] p-3 rounded-lg border border-[#EDE5D5]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="material-symbols-outlined text-[16px] text-slate-500">
                      image
                    </span>
                    <span className="font-medium text-[#0B132B] truncate">
                      {selectedFile?.name}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 shrink-0">
                    {selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB
                  </span>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleInspect}
                disabled={!selectedFile || isInspecting}
                className={`w-full py-3 px-4 rounded-xl font-sans font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  !selectedFile || isInspecting
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-crimson hover:bg-red-700 text-white shadow-crimson/25 hover:shadow-lg'
                }`}
              >
                {isInspecting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                    <span>Extracting text & screening rules...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">
                      document_scanner
                    </span>
                    <span>Inspect Image Asset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Extracted Copy & Compliance Findings */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white rounded-xl p-6 border border-[#E5DDCB] sumi-card-shadow flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-crimson text-[22px]">
                  rule
                </span>
                <h3 className="font-serif text-xl font-bold text-[#0B132B]">
                  Inspection Findings
                </h3>
              </div>

              {result && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase ${
                      result.processing_status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : result.processing_status === 'no_text_detected'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {result.processing_status.replace(/_/g, ' ')}
                  </span>
                  {result.ocr_confidence !== null && result.ocr_confidence !== undefined && (
                    <span className="text-[11px] font-mono text-slate-500">
                      OCR: {result.ocr_confidence}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {!result ? (
              <div className="border border-dashed border-[#DDD4C0] rounded-xl p-10 flex flex-col items-center justify-center gap-2 text-center text-slate-400 bg-[#FAF8F2]/50 min-h-[300px]">
                <span className="material-symbols-outlined text-[36px] text-slate-300">
                  find_in_page
                </span>
                <p className="font-serif text-base text-slate-600 font-medium">
                  Awaiting Asset Inspection
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Upload an image ad or banner and click &quot;Inspect Image Asset&quot; to extract copy and evaluate policy compliance.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Extracted Text Box */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Extracted Text Copy
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {result.extracted_text ? `${result.extracted_text.length} chars` : '0 chars'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#FAF8F2] border border-[#E5DDCB] text-xs font-mono text-[#0B132B] whitespace-pre-wrap max-h-[160px] overflow-y-auto leading-relaxed">
                    {result.extracted_text || (
                      <span className="italic text-slate-400">
                        No readable text detected in this image.
                      </span>
                    )}
                  </div>
                </div>

                {/* Findings Count Summary */}
                <div className="flex items-center justify-between pt-2 border-t border-[#F0EAE0]">
                  <span className="font-serif text-base font-bold text-[#0B132B]">
                    {result.findings.length} Compliance Findings
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Brand: {brand.name}
                  </span>
                </div>

                {/* Findings List */}
                {result.findings.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600 text-[22px]">
                      check_circle
                    </span>
                    <div>
                      <p className="font-serif font-bold text-[14px]">No policy violations found</p>
                      <p className="text-emerald-800 text-[11px] mt-0.5">
                        Extracted text satisfies all active brand terminology and prohibited claim rules.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {result.findings.map((f: AssetFinding, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border flex flex-col gap-2 ${
                          f.severity === 'critical'
                            ? 'bg-red-50/60 border-red-200'
                            : 'bg-amber-50/60 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                              f.severity === 'critical'
                                ? 'bg-crimson text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {f.severity}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 uppercase">
                            {f.category.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-sm text-[#0B132B]">
                          {f.title}
                        </h4>

                        <p className="text-xs text-slate-700 leading-relaxed">
                          {f.explanation}
                        </p>

                        {f.evidence && (
                          <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded border border-[#E5DDCB] font-mono">
                            <strong>Mandate:</strong> {f.evidence}
                          </div>
                        )}

                        {f.suggested_rewrite && (
                          <div className="text-[11px] text-[#0B132B] bg-emerald-50/70 p-2 rounded border border-emerald-200">
                            <span className="font-semibold text-emerald-800">Recommendation:</span>{' '}
                            {f.suggested_rewrite}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
