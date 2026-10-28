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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070C1E]/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-xl border border-[#E5DDCB] p-6 shadow-2xl flex flex-col gap-4 text-[#18181B]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DD]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-crimson flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-[20px]">
                domain_add
              </span>
            </div>
            <h3 className="font-editorial text-[20px] font-bold text-[#0B132B]">
              Create Brand Workspace
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-[#F6F3EC] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-crimson text-[13px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Brand Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Brand Name <span className="text-crimson">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Enterprise Core, BioHealth Labs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#FAF7F0] text-[#0B132B] px-3.5 py-2.5 rounded-lg border border-[#E5DDCB] text-[14px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-all"
            />
          </div>

          {/* Industry */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Industry (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Fintech, Healthcare, Aerospace, SaaS"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="bg-[#FAF7F0] text-[#0B132B] px-3.5 py-2.5 rounded-lg border border-[#E5DDCB] text-[14px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-all"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the brand's governance scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#FAF7F0] text-[#0B132B] px-3.5 py-2 rounded-lg border border-[#E5DDCB] text-[14px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-all resize-none"
            />
          </div>

          {/* Primary Accent Color Hint */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#FAF7F0] border border-[#E5DDCB]">
            <div className="flex flex-col">
              <span className="font-sans text-[12px] font-semibold text-[#0B132B]">
                Identity Accent Color
              </span>
              <span className="text-[11px] text-slate-500">
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
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECE7DD]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-[#F6F3EC] font-sans text-[13px] font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-crimson hover:bg-crimson-deep text-white font-sans text-[13px] font-bold tracking-wide uppercase transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
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
