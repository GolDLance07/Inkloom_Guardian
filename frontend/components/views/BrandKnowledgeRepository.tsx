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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <h3 className="font-display text-[18px] text-text-mist">Please select a brand workspace</h3>
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
    <div className="flex flex-col w-full px-8 py-6 pb-20 gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-electric-lime text-[26px]">
              menu_book
            </span>
            <h2 className="font-display text-[22px] font-bold text-text-mist">
              Brand Knowledge Repository
            </h2>
          </div>
          <p className="text-[13px] text-text-muted">
            Managing certified guidelines, terminology, and approved facts for <strong className="text-text-mist font-semibold">{brand.name}</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-electric-lime hover:bg-white text-surface-obsidian font-display text-[13px] font-semibold transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-auto"
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
              className={`px-3 py-1.5 rounded-lg font-display text-[12px] whitespace-nowrap transition-colors cursor-pointer border ${
                selectedKind === k.id
                  ? 'bg-surface-graphite text-electric-lime border-electric-lime font-semibold'
                  : 'bg-surface-obsidian text-text-muted hover:text-text-mist border-border-subtle'
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
            className="w-full bg-surface-obsidian text-text-mist pl-9 pr-4 py-2 rounded-lg border border-border-subtle text-[13px] focus:outline-none focus:border-electric-lime placeholder:text-text-muted"
          />
          <span className="material-symbols-outlined text-text-muted text-[16px] absolute left-3 top-2.5">
            search
          </span>
        </div>
      </div>

      {/* Knowledge Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-text-muted flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
          <span>Loading knowledge repository...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 rounded-xl bg-surface-graphite border border-border-subtle text-center flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[36px] text-text-muted">
            library_books
          </span>
          <h4 className="font-display text-[16px] font-semibold text-text-mist">
            No knowledge records found
          </h4>
          <p className="text-[13px] text-text-muted max-w-md">
            {searchQuery
              ? `No items match the filter '${searchQuery}'.`
              : 'Add your first approved guideline, fact, or prohibited term to activate automated checks.'}
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-lg bg-surface-graphite-elevated text-electric-lime font-display text-[13px] font-semibold border border-electric-lime/40 hover:bg-surface-variant transition-colors cursor-pointer"
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
                  ? 'bg-surface-graphite border-border-subtle hover:border-border-strong shadow-sm'
                  : 'bg-surface-container-low border-border-subtle/50 opacity-60'
              }`}
            >
              <div className="flex flex-col gap-2">
                {/* Kind & Status */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded font-display text-[10px] uppercase font-semibold tracking-wider ${
                      item.kind === 'prohibited_term'
                        ? 'bg-critical-red-surface text-critical-red border border-critical-red/30'
                        : item.kind === 'preferred_term'
                        ? 'bg-info-cyan-surface text-info-cyan border border-info-cyan/30'
                        : item.kind === 'fact'
                        ? 'bg-electric-lime-muted text-electric-lime border border-electric-lime/30'
                        : 'bg-warning-amber-surface text-warning-amber border border-warning-amber/30'
                    }`}
                  >
                    {item.kind.replace('_', ' ')}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`text-[11px] font-display font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      item.active
                        ? 'bg-electric-lime-muted text-electric-lime'
                        : 'bg-surface-obsidian text-text-muted hover:text-text-mist'
                    }`}
                  >
                    {item.active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                {/* Title */}
                <h4 className="font-display text-[14px] font-semibold text-text-mist leading-snug">
                  {item.title}
                </h4>

                {/* Value / Content */}
                <p className="text-[13px] text-text-mist bg-surface-obsidian p-2.5 rounded-lg border border-border-subtle font-body italic leading-relaxed">
                  &quot;{item.content}&quot;
                </p>

                {/* Config Details */}
                {item.rule_config?.replacement && (
                  <div className="text-[11px] text-text-muted">
                    <span className="text-electric-lime font-medium">Auto-rewrite:</span> &quot;{item.rule_config.replacement}&quot;
                  </div>
                )}
                {item.rule_config?.disallowed && (
                  <div className="text-[11px] text-text-muted">
                    <span className="text-info-cyan font-medium">Disallowed:</span> {item.rule_config.disallowed.join(', ')}
                  </div>
                )}
              </div>

              {/* Footer with Citation & Delete */}
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50 text-[11px] font-display text-text-muted">
                <span className="truncate max-w-[180px]">Ref: {item.source_label}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-text-muted hover:text-critical-red transition-colors p-1 rounded cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-surface-graphite rounded-xl border border-border-strong p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-lime text-[22px]">
                  post_add
                </span>
                <h3 className="font-display text-[18px] font-semibold text-text-mist">
                  Add Knowledge Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-mist p-1 rounded-lg hover:bg-surface-obsidian transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-critical-red-surface border border-critical-red/30 text-critical-red text-[13px]">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateKnowledge} className="flex flex-col gap-4">
              {/* Kind */}
              <div className="flex flex-col gap-1">
                <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Rule Kind
                </label>
                <select
                  value={newKind}
                  onChange={(e) => setNewKind(e.target.value)}
                  className="bg-surface-obsidian text-text-mist px-3 py-2 rounded-lg border border-border-subtle text-[13px] focus:outline-none focus:border-electric-lime"
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
              <div className="flex flex-col gap-1">
                <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Rule Title <span className="text-electric-lime">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Restricted Absolute Risk Guarantees"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-surface-obsidian text-text-mist px-3 py-2 rounded-lg border border-border-subtle text-[13px] focus:outline-none focus:border-electric-lime"
                />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1">
                <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Certified Text / Term / Fact <span className="text-electric-lime">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. guaranteed zero foreign exchange risk"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="bg-surface-obsidian text-text-mist px-3 py-2 rounded-lg border border-border-subtle text-[13px] focus:outline-none focus:border-electric-lime resize-none"
                />
              </div>

              {/* Source Label */}
              <div className="flex flex-col gap-1">
                <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Source Reference / Citation <span className="text-electric-lime">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEC-RULE-156 / COMP-402, Brand Guidelines 2025"
                  value={newSourceLabel}
                  onChange={(e) => setNewSourceLabel(e.target.value)}
                  className="bg-surface-obsidian text-text-mist px-3 py-2 rounded-lg border border-border-subtle text-[13px] focus:outline-none focus:border-electric-lime"
                />
              </div>

              {/* Optional Replacement */}
              <div className="flex flex-col gap-1">
                <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Suggested Replacement (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. automated algorithmic hedging designed to mitigate FX exposure"
                  value={newReplacement}
                  onChange={(e) => setNewReplacement(e.target.value)}
                  className="bg-surface-obsidian text-text-mist px-3 py-2 rounded-lg border border-border-subtle text-[13px] focus:outline-none focus:border-electric-lime"
                />
              </div>

              {/* Disallowed Synonyms (for preferred terms) */}
              {newKind === 'preferred_term' && (
                <div className="flex flex-col gap-1">
                  <label className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Disallowed Synonyms (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. crypto-rail, crypto rail, crypto rails"
                    value={newDisallowed}
                    onChange={(e) => setNewDisallowed(e.target.value)}
                    className="bg-surface-obsidian text-text-mist px-3 py-2 rounded-lg border border-border-subtle text-[13px] focus:outline-none focus:border-electric-lime"
                  />
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-text-muted hover:text-text-mist hover:bg-surface-obsidian font-display text-[13px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-electric-lime text-surface-obsidian font-display text-[13px] font-semibold hover:bg-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
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
