'use client';

import React, { useState, useEffect } from 'react';
import { Brand, KnowledgeItem, KnowledgeItemCreate } from '@/lib/types';
import { api } from '@/lib/api';

interface BrandKnowledgeRepositoryProps {
  brand: Brand | null;
}

export const BrandKnowledgeRepository: React.FC<BrandKnowledgeRepositoryProps> = ({ brand }) => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [newKind, setNewKind] = useState('prohibited_term');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSourceLabel, setNewSourceLabel] = useState('');
  const [newReplacement, setNewReplacement] = useState('');
  const [newDisallowed, setNewDisallowed] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchKnowledge = async () => {
    if (!brand) return;
    try {
      setLoading(true);
      const data = await api.getKnowledge(brand.id);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [brand]);

  const handleToggleActive = async (item: KnowledgeItem) => {
    if (!brand) return;
    try {
      const updated = await api.updateKnowledgeItem(brand.id, item.id, {
        active: !item.active,
      });
      setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!brand) return;
    try {
      await api.deleteKnowledgeItem(brand.id, itemId, true);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;
    if (!newTitle.trim() || !newContent.trim() || !newSourceLabel.trim()) {
      setFormError('Title, content, and source label are required.');
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      const ruleConfig: Record<string, any> = {};
      if (newReplacement.trim()) {
        ruleConfig.replacement = newReplacement.trim();
      }
      if (newDisallowed.trim()) {
        ruleConfig.disallowed = newDisallowed.split(',').map((s) => s.trim()).filter(Boolean);
      }

      const payload: KnowledgeItemCreate = {
        kind: newKind,
        title: newTitle.trim(),
        content: newContent.trim(),
        source_label: newSourceLabel.trim(),
        active: true,
        rule_config: ruleConfig,
      };

      const created = await api.createKnowledgeItem(brand.id, payload);
      setItems((prev) => [created, ...prev]);
      setIsModalOpen(false);

      // Reset
      setNewTitle('');
      setNewContent('');
      setNewSourceLabel('');
      setNewReplacement('');
      setNewDisallowed('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create knowledge item.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-ink-wash">
        <h3 className="font-editorial text-[20px] font-bold text-[#0B132B]">Please select a brand workspace</h3>
      </div>
    );
  }

  const filteredItems = items.filter((it) => {
    const matchesKind = selectedKind === 'all' || it.kind === selectedKind;
    const matchesSearch =
      it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.source_label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesKind && matchesSearch;
  });

  const kinds = [
    { id: 'all', label: 'All Records' },
    { id: 'prohibited_term', label: 'Prohibited Terms' },
    { id: 'preferred_term', label: 'Preferred Terms' },
    { id: 'fact', label: 'Approved Facts' },
    { id: 'disclaimer', label: 'Disclaimers' },
    { id: 'guideline', label: 'Guidelines' },
    { id: 'claim', label: 'Claims' },
  ];

  return (
    <div className="flex flex-col w-full px-8 py-6 pb-20 gap-6 bg-ink-wash min-h-screen text-[#18181B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DEC8]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-crimson text-[26px]">
              menu_book
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#0B132B]">
              Brand Knowledge Repository
            </h2>
          </div>
          <p className="text-xs text-[#64748B]">
            Managing certified guidelines, terminology, and approved facts for <strong className="text-[#0B132B] font-semibold">{brand.name}</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B132B] hover:bg-[#141D3B] text-white font-sans text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Add knowledge item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setSelectedKind(k.id)}
              className={`px-3 py-1.5 rounded-lg font-sans text-xs whitespace-nowrap transition-colors cursor-pointer border ${
                selectedKind === k.id
                  ? 'bg-[#0B132B] text-white border-[#0B132B] font-semibold shadow-xs'
                  : 'bg-white text-[#64748B] hover:text-[#0B132B] border-[#E2D8C4]'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge by keyword or source..."
            className="w-full bg-white text-[#0B132B] pl-9 pr-4 py-2 rounded-lg border border-[#E5DDCB] text-[13px] focus:outline-none focus:border-crimson placeholder:text-slate-400 shadow-xs"
          />
          <span className="material-symbols-outlined text-slate-400 text-[16px] absolute left-3 top-2.5">
            search
          </span>
        </div>
      </div>

      {/* Knowledge Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-crimson animate-spin">progress_activity</span>
          <span>Loading knowledge repository...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 rounded-xl bg-white border border-[#E5DDCB] text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <span className="material-symbols-outlined text-[36px] text-slate-400">
            library_books
          </span>
          <h4 className="font-editorial text-[18px] font-bold text-[#0B132B]">
            No knowledge records found
          </h4>
          <p className="text-[13px] text-slate-600 max-w-md">
            {searchQuery
              ? `No items match the filter '${searchQuery}'.`
              : 'Add your first approved guideline, fact, or prohibited term to activate automated checks.'}
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-lg bg-[#0B132B] text-white font-sans text-[12px] font-bold uppercase tracking-wider hover:bg-[#15203D] transition-colors cursor-pointer"
          >
            + Add Knowledge Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                item.active
                  ? 'bg-white border-[#E5DDCB] hover:border-crimson/50 sumi-card-shadow'
                  : 'bg-[#F8F5EE] border-[#E5DDCB]/60 opacity-60'
              }`}
            >
              <div className="flex flex-col gap-2">
                {/* Kind & Status */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded font-sans text-[10px] uppercase font-bold tracking-wider ${
                      item.kind === 'prohibited_term'
                        ? 'bg-red-50 text-crimson border border-red-200'
                        : item.kind === 'preferred_term'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : item.kind === 'fact'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.kind.replace('_', ' ')}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`text-[11px] font-sans font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      item.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {item.active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                {/* Title */}
                <h4 className="font-editorial text-[16px] font-bold text-[#0B132B] leading-snug">
                  {item.title}
                </h4>

                {/* Value / Content */}
                <p className="text-[13px] text-[#0B132B] bg-[#F8F5EE] p-3 rounded-lg border border-[#E5DDCB] font-body italic leading-relaxed">
                  &quot;{item.content}&quot;
                </p>

                {/* Config Details */}
                {item.rule_config?.replacement && (
                  <div className="text-[11px] text-slate-600">
                    <span className="text-emerald-700 font-bold">Auto-rewrite:</span> &quot;{item.rule_config.replacement}&quot;
                  </div>
                )}
                {item.rule_config?.disallowed && (
                  <div className="text-[11px] text-slate-600">
                    <span className="text-blue-700 font-bold">Disallowed:</span> {item.rule_config.disallowed.join(', ')}
                  </div>
                )}
              </div>

              {/* Footer with Citation & Delete */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[#ECE7DD] text-[11px] font-sans text-slate-500">
                <span className="truncate max-w-[180px]">Ref: {item.source_label}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-slate-400 hover:text-crimson transition-colors p-1 rounded cursor-pointer"
                  title="Delete knowledge item"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Knowledge Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070C1E]/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white rounded-xl border border-[#E5DDCB] p-6 shadow-2xl flex flex-col gap-4 text-[#18181B]">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DD]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-crimson flex items-center justify-center text-white shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">
                    post_add
                  </span>
                </div>
                <h3 className="font-editorial text-[20px] font-bold text-[#0B132B]">
                  Add Knowledge Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-[#F6F3EC] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-crimson text-[13px]">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateKnowledge} className="flex flex-col gap-4">
              {/* Kind */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Rule Kind
                </label>
                <select
                  value={newKind}
                  onChange={(e) => setNewKind(e.target.value)}
                  className="bg-[#FAF7F0] text-[#0B132B] px-3.5 py-2.5 rounded-lg border border-[#E5DDCB] text-[13px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson"
                >
                  <option value="prohibited_term">Prohibited Term (Critical)</option>
                  <option value="preferred_term">Preferred Term (Terminology)</option>
                  <option value="fact">Approved Fact (Factual Verification)</option>
                  <option value="disclaimer">Required Disclaimer</option>
                  <option value="guideline">Editorial Guideline</option>
                  <option value="claim">Approved Claim</option>
                </select>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Rule Title <span className="text-crimson">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Restricted Absolute Risk Guarantees"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-[#FAF7F0] text-[#0B132B] px-3.5 py-2.5 rounded-lg border border-[#E5DDCB] text-[13px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson"
                />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Certified Text / Term / Fact <span className="text-crimson">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. guaranteed zero foreign exchange risk"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="bg-[#FAF7F0] text-[#0B132B] px-3.5 py-2 rounded-lg border border-[#E5DDCB] text-[13px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson resize-none"
                />
              </div>

              {/* Source Label */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Source Reference / Citation <span className="text-crimson">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEC-RULE-156 / COMP-402, Brand Guidelines 2025"
                  value={newSourceLabel}
                  onChange={(e) => setNewSourceLabel(e.target.value)}
                  className="bg-[#FAF7F0] text-[#0B132B] px-3.5 py-2.5 rounded-lg border border-[#E5DDCB] text-[13px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson"
                />
              </div>

              {/* Optional Replacement */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Suggested Replacement (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. automated algorithmic hedging designed to mitigate FX exposure"
                  value={newReplacement}
                  onChange={(e) => setNewReplacement(e.target.value)}
                  className="bg-[#FAF7F0] text-[#0B132B] px-3.5 py-2.5 rounded-lg border border-[#E5DDCB] text-[13px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson"
                />
              </div>

              {/* Disallowed Synonyms (for preferred terms) */}
              {newKind === 'preferred_term' && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Disallowed Synonyms (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. crypto-rail, crypto rail, crypto rails"
                    value={newDisallowed}
                    onChange={(e) => setNewDisallowed(e.target.value)}
                    className="bg-[#FAF7F0] text-[#0B132B] px-3.5 py-2.5 rounded-lg border border-[#E5DDCB] text-[13px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson"
                  />
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECE7DD]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-[#F6F3EC] font-sans text-[13px] font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-crimson hover:bg-crimson-deep text-white font-sans text-[13px] font-bold tracking-wide uppercase transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSaving && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                  <span>Save Knowledge Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
