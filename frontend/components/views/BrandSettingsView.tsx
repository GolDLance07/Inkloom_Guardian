'use client';

import React, { useState, useEffect } from 'react';
import { Brand } from '@/lib/types';
import { api } from '@/lib/api';

interface BrandSettingsViewProps {
  brand: Brand | null;
  onBrandUpdated: (updatedBrand: Brand) => void;
}

export const BrandSettingsView: React.FC<BrandSettingsViewProps> = ({ brand, onBrandUpdated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#C6FF4D');
  const [secondaryColor, setSecondaryColor] = useState('#242A26');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setDescription(brand.description || '');
      setIndustry(brand.industry || '');
      setLogoUrl(brand.logo_url || '');
      setPrimaryColor(brand.visual_config?.primary_color || '#C6FF4D');
      setSecondaryColor(brand.visual_config?.secondary_color || '#242A26');
      setStatusMessage(null);
    }
  }, [brand]);

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-ink-wash">
        <h3 className="font-editorial text-[20px] font-bold text-[#0B132B]">Please select a brand workspace</h3>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setStatusMessage(null);
      const updated = await api.updateBrand(brand.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        industry: industry.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        visual_config: {
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        },
      });

      onBrandUpdated(updated);
      setStatusMessage('Brand identity settings successfully saved.');
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message || 'Failed to save settings'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-8 py-6 pb-20 gap-6 max-w-5xl bg-ink-wash min-h-screen text-[#18181B]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#E6DEC8]">
        <span className="material-symbols-outlined text-crimson text-[26px]">
          tune
        </span>
        <div className="flex flex-col">
          <h2 className="font-serif text-2xl font-bold text-[#0B132B]">
            Brand Workspace Settings
          </h2>
          <p className="text-xs text-[#64748B]">
            Configure metadata, identity tokens, and visual representation for <strong className="text-[#0B132B]">{brand.name}</strong>.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-[13px] flex items-center gap-2 ${
            statusMessage.startsWith('Error')
              ? 'bg-red-50 border-red-200 text-crimson'
              : 'bg-emerald-50 border-emerald-200 text-[#22C55E] font-sans font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {statusMessage.startsWith('Error') ? 'error' : 'check_circle'}
          </span>
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Form (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-white rounded-xl p-6 border border-[#E5DDCB] sumi-card-shadow flex flex-col gap-4">
          <h3 className="font-serif text-lg font-bold text-[#0B132B] pb-2 border-b border-[#F0EAE0]">
            General Identity
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Brand Name <span className="text-crimson">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#FAF8F2] text-[#0B132B] px-3.5 py-2.5 rounded-lg border border-[#E2D8C4] text-[14px] focus:outline-none focus:border-[#0B132B]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Brand Slug (Immutable)
            </label>
            <input
              type="text"
              disabled
              value={brand.slug}
              className="bg-[#FAF8F2] text-[#64748B] px-3.5 py-2.5 rounded-lg border border-[#E2D8C4] text-[14px] opacity-70 cursor-not-allowed font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Industry or Market Sector
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Enterprise Cloud Computing"
              className="bg-[#FAF8F2] text-[#0B132B] px-3.5 py-2.5 rounded-lg border border-[#E2D8C4] text-[14px] focus:outline-none focus:border-[#0B132B]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#FAF8F2] text-[#0B132B] p-3 rounded-lg border border-[#E2D8C4] text-[14px] focus:outline-none focus:border-[#0B132B] resize-none"
            />
          </div>

          <h3 className="font-serif text-lg font-bold text-[#0B132B] pt-2 pb-2 border-b border-[#F0EAE0]">
            Identity Color Tokens
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Accent Token
              </label>
              <div className="flex items-center gap-2 bg-[#FAF8F2] p-2 rounded-lg border border-[#E2D8C4]">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                />
                <span className="font-mono text-[12px] text-[#0B132B]">{primaryColor}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Secondary Surface
              </label>
              <div className="flex items-center gap-2 bg-[#FAF8F2] p-2 rounded-lg border border-[#E2D8C4]">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                />
                <span className="font-mono text-[12px] text-[#0B132B]">{secondaryColor}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0EAE0] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-[#0B132B] hover:bg-[#141D3B] text-white font-sans text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSaving && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              <span>Save Identity Settings</span>
            </button>
          </div>
        </form>

        {/* Live Identity Card Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-6 border border-[#E5DDCB] sumi-card-shadow flex flex-col gap-4">
            <h3 className="font-serif text-base font-bold text-[#0B132B]">
              Live Brand Identity Preview
            </h3>

            <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#E2D8C4] flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-sans text-[20px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {name.slice(0, 2).toUpperCase() || 'BG'}
                </div>
                <div className="flex flex-col">
                  <span className="font-editorial text-[18px] font-bold text-[#0B132B]">
                    {name || 'Brand Name'}
                  </span>
                  <span className="text-[12px] text-[#64748B]">
                    {industry || 'Industry unspecified'}
                  </span>
                </div>
              </div>

              <p className="text-[13px] text-[#475569] leading-relaxed italic">
                &quot;{description || 'No description provided for this brand workspace.'}&quot;
              </p>

              <div className="pt-3 border-t border-[#E2D8C4] flex items-center justify-between text-[11px] font-sans text-[#64748B]">
                <span>Status: Configured</span>
                <span className="text-emerald-700 font-bold">Compliance Ready</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#FAF8F2] border border-[#E2D8C4] text-[12px] text-[#64748B] flex items-start gap-2.5">
              <span className="material-symbols-outlined text-blue-700 text-[18px] shrink-0 mt-0.5">
                verified
              </span>
              <span>
                Brand identity colors act as visual presentation hints and do not override accessible application contrast.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
