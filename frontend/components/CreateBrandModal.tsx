'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Brand } from '@/lib/types';

interface CreateBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrandCreated: (newBrand: Brand) => void;
}

export const CreateBrandModal: React.FC<CreateBrandModalProps> = ({
  isOpen,
  onClose,
  onBrandCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#C6FF4D');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Brand name is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const brand = await api.createBrand({
        name: name.trim(),
        description: description.trim() || undefined,
        industry: industry.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        visual_config: {
          primary_color: primaryColor,
        },
      });

      onBrandCreated(brand);
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setIndustry('');
      setLogoUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to create brand.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-surface-graphite rounded-xl border border-border-strong p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-electric-lime text-[24px]">
              domain_add
            </span>
            <h3 className="font-display text-[18px] font-semibold text-text-mist">
              Create Brand Workspace
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-mist p-1 rounded-lg hover:bg-surface-obsidian transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-critical-red-surface border border-critical-red/30 text-critical-red text-[13px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Brand Name */}
          <div className="flex flex-col gap-1">
            <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Brand Name <span className="text-electric-lime">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Enterprise Core, BioHealth Labs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-obsidian text-text-mist px-3 py-2.5 rounded-lg border border-border-subtle text-[14px] focus:outline-none focus:border-electric-lime"
            />
          </div>

          {/* Industry */}
          <div className="flex flex-col gap-1">
            <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Industry (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Fintech, Healthcare, Aerospace, SaaS"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="bg-surface-obsidian text-text-mist px-3 py-2.5 rounded-lg border border-border-subtle text-[14px] focus:outline-none focus:border-electric-lime"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the brand's governance scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-surface-obsidian text-text-mist px-3 py-2 rounded-lg border border-border-subtle text-[14px] focus:outline-none focus:border-electric-lime resize-none"
            />
          </div>

          {/* Primary Accent Color Hint */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-obsidian border border-border-subtle">
            <div className="flex flex-col">
              <span className="font-display text-[12px] font-semibold text-text-mist">
                Identity Accent Color
              </span>
              <span className="text-[11px] text-text-muted">
                Visual presentation hint for the brand preview badge.
              </span>
            </div>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-text-muted hover:text-text-mist hover:bg-surface-obsidian font-display text-[13px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-electric-lime text-surface-obsidian font-display text-[13px] font-semibold hover:bg-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              <span>Create Brand</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
