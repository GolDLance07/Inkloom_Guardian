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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <h3 className="font-display text-[18px] text-text-mist">Please select a brand workspace</h3>
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
    <div className="flex flex-col w-full px-8 py-6 pb-20 gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
        <span className="material-symbols-outlined text-electric-lime text-[26px]">
          tune
        </span>
        <div className="flex flex-col">
          <h2 className="font-display text-[22px] font-bold text-text-mist">
            Brand Workspace Settings
          </h2>
          <p className="text-[13px] text-text-muted">
            Configure metadata, identity tokens, and visual representation for <strong className="text-text-mist">{brand.name}</strong>.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-[13px] flex items-center gap-2 ${
            statusMessage.startsWith('Error')
              ? 'bg-critical-red-surface border-critical-red/40 text-critical-red'
              : 'bg-electric-lime-muted border-electric-lime/40 text-electric-lime font-display'
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
        <form onSubmit={handleSave} className="lg:col-span-7 bg-surface-graphite rounded-xl p-6 border border-border-subtle shadow-md flex flex-col gap-4">
          <h3 className="font-display text-[16px] font-semibold text-text-mist pb-2 border-b border-border-subtle">
            General Identity
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Brand Name <span className="text-electric-lime">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-obsidian text-text-mist px-3.5 py-2.5 rounded-lg border border-border-subtle text-[14px] focus:outline-none focus:border-electric-lime"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Brand Slug (Immutable)
            </label>
            <input
              type="text"
              disabled
              value={brand.slug}
              className="bg-surface-obsidian text-text-muted px-3.5 py-2.5 rounded-lg border border-border-subtle text-[14px] opacity-70 cursor-not-allowed font-display"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Industry or Market Sector
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Enterprise Cloud Computing"
              className="bg-surface-obsidian text-text-mist px-3.5 py-2.5 rounded-lg border border-border-subtle text-[14px] focus:outline-none focus:border-electric-lime"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-surface-obsidian text-text-mist p-3 rounded-lg border border-border-subtle text-[14px] focus:outline-none focus:border-electric-lime resize-none"
            />
          </div>

          <h3 className="font-display text-[16px] font-semibold text-text-mist pt-2 pb-2 border-b border-border-subtle">
            Identity Color Tokens
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Accent Token
              </label>
              <div className="flex items-center gap-2 bg-surface-obsidian p-2 rounded-lg border border-border-subtle">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                />
                <span className="font-display text-[12px] text-text-mist">{primaryColor}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Secondary Surface
              </label>
              <div className="flex items-center gap-2 bg-surface-obsidian p-2 rounded-lg border border-border-subtle">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                />
                <span className="font-display text-[12px] text-text-mist">{secondaryColor}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-electric-lime hover:bg-white text-surface-obsidian font-display text-[13px] font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSaving && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              <span>Save Identity Settings</span>
            </button>
          </div>
        </form>

        {/* Live Identity Card Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-surface-graphite rounded-xl p-6 border border-border-subtle shadow-md flex flex-col gap-4">
            <h3 className="font-display text-[14px] font-semibold text-text-muted uppercase tracking-wider">
              Live Brand Identity Preview
            </h3>

            <div className="p-6 rounded-xl bg-surface-obsidian border border-border-subtle flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-display text-[20px] font-bold text-surface-obsidian shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {name.slice(0, 2).toUpperCase() || 'BG'}
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-[18px] font-bold text-text-mist">
                    {name || 'Brand Name'}
                  </span>
                  <span className="text-[12px] text-text-muted">
                    {industry || 'Industry unspecified'}
                  </span>
                </div>
              </div>

              <p className="text-[13px] text-text-muted leading-relaxed italic">
                &quot;{description || 'No description provided for this brand workspace.'}&quot;
              </p>

              <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] font-display text-text-muted">
                <span>Status: Configured</span>
                <span className="text-electric-lime">Compliance Ready</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-obsidian border border-border-subtle text-[12px] text-text-muted flex items-start gap-2.5">
              <span className="material-symbols-outlined text-info-cyan text-[18px] shrink-0 mt-0.5">
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
