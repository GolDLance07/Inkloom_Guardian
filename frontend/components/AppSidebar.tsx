'use client';

import React from 'react';
import { Brand } from '@/lib/types';

interface AppSidebarProps {
  brands: Brand[];
  selectedBrand: Brand | null;
  onSelectBrand: (brand: Brand) => void;
  activeTab: 'review' | 'knowledge' | 'history' | 'settings';
  setActiveTab: (tab: 'review' | 'knowledge' | 'history' | 'settings') => void;
  onOpenCreateBrand: () => void;
  engineActive: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  brands,
  selectedBrand,
  onSelectBrand,
  activeTab,
  setActiveTab,
  onOpenCreateBrand,
  engineActive,
}) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-graphite z-50 flex flex-col justify-between border-r border-border-subtle shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col">
        {/* Brand Wordmark & Engine Pulse */}
        <div className="h-16 px-4 flex items-center justify-between bg-surface-obsidian border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-crimson flex items-center justify-center text-white shadow-md shadow-crimson/30">
              <span className="material-symbols-outlined text-[20px]">
                shield_lock
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-[16px] font-bold tracking-tight text-white leading-tight">
                Inkloom
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-red-400 font-bold leading-none mt-0.5">
                GUARDIAN
              </span>
            </div>
          </div>
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              engineActive ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-crimson'
            }`}
            title={engineActive ? 'Governance Engine Online' : 'Engine Offline'}
          />
        </div>

        {/* Brand Selector Dropdown */}
        <div className="p-4 border-b border-border-subtle/40">
          <div className="p-2.5 rounded-lg bg-surface-container-high border border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Active Brand
              </span>
              <button
                type="button"
                onClick={onOpenCreateBrand}
                className="font-display text-[11px] text-electric-lime hover:underline cursor-pointer"
              >
                + Create brand
              </button>
            </div>

            <div className="relative">
              <select
                className="w-full bg-surface-graphite text-text-mist text-[13px] px-3 py-2 rounded-lg border border-border-subtle appearance-none cursor-pointer focus:outline-none focus:border-electric-lime"
                value={selectedBrand?.id || ''}
                onChange={(e) => {
                  const b = brands.find((x) => x.id === e.target.value);
                  if (b) onSelectBrand(b);
                }}
              >
                {brands.length === 0 ? (
                  <option value="">No brands available</option>
                ) : (
                  brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.is_demo ? ' (Demo)' : ''}
                    </option>
                  ))
                )}
              </select>
              <span className="material-symbols-outlined text-text-muted text-[16px] absolute right-2.5 top-2.5 pointer-events-none">
                unfold_more
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 flex flex-col gap-1 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'review'
                ? 'bg-surface-graphite-elevated text-electric-lime font-medium border border-electric-lime/30'
                : 'text-text-muted hover:bg-surface-graphite-elevated hover:text-text-mist'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">policy</span>
            <span className="font-display text-[13px] tracking-wide">Review</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'knowledge'
                ? 'bg-surface-graphite-elevated text-electric-lime font-medium border border-electric-lime/30'
                : 'text-text-muted hover:bg-surface-graphite-elevated hover:text-text-mist'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
            <span className="font-display text-[13px] tracking-wide">Brand knowledge</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-surface-graphite-elevated text-electric-lime font-medium border border-electric-lime/30'
                : 'text-text-muted hover:bg-surface-graphite-elevated hover:text-text-mist'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">history_toggle_off</span>
            <span className="font-display text-[13px] tracking-wide">Review history</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-surface-graphite-elevated text-electric-lime font-medium border border-electric-lime/30'
                : 'text-text-muted hover:bg-surface-graphite-elevated hover:text-text-mist'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
            <span className="font-display text-[13px] tracking-wide">Brand settings</span>
          </button>
        </nav>
      </div>

      {/* Footer System Tier */}
      <div className="p-4 border-t border-border-subtle bg-surface-obsidian/50">
        <div className="p-3 rounded-lg bg-surface-obsidian flex flex-col gap-2 border border-border-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-mono text-[10px] text-emerald-400 font-bold tracking-wider">
                IMMUTABLE AUDIT
              </span>
            </div>
            <span className="font-mono text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
              v4.2 Ent
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-mono">
            <span className="material-symbols-outlined text-gray-500 text-[14px]">lock</span>
            <span className="truncate">Sovereign Proof Engine</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
