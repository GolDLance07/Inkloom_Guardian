'use client';

import React from 'react';
import { HealthStatus, Brand } from '@/lib/types';

interface AppHeaderProps {
  health: HealthStatus | null;
  selectedBrand: Brand | null;
  onOpenCreateBrand: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  health,
  selectedBrand,
  onOpenCreateBrand,
}) => {
  const isApiConnected = health?.status === 'healthy';
  const isAiActive = health?.ai_enabled;

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-[#FDFBF7]/90 backdrop-blur-md z-40 flex items-center justify-between px-8 border-b border-[#EAE3D2] shadow-xs">
      {/* Status Badges */}
      <div className="flex items-center gap-3">
        {/* AI Engine Status */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E2D9C8] text-[#0B132B] text-xs font-semibold shadow-xs">
          <span className="material-symbols-outlined text-[16px] text-[#0B132B]">
            {isAiActive ? 'neurology' : 'rule'}
          </span>
          <span>
            {isAiActive
              ? 'AI enabled • Rules engine active'
              : 'Deterministic Rules-only mode active'}
          </span>
        </div>

        {/* Minimal subtle audit indicator */}
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#64748B] font-mono bg-[#F7F3EB] px-2.5 py-1 rounded-md border border-[#E2D9C8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> #TR-94281-EXP
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {selectedBrand ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E2D9C8] text-xs font-medium text-[#0B132B] shadow-xs">
            <span className="text-[#64748B]">Target:</span>
            <span className="font-semibold text-[#0B132B] truncate max-w-[180px]">
              {selectedBrand.name}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenCreateBrand}
            className="px-3 py-1.5 rounded-lg bg-crimson text-white font-sans text-xs font-semibold hover:bg-crimson-deep transition-colors cursor-pointer shadow-xs"
          >
            + Create Brand
          </button>
        )}

        <div className="h-4 w-px bg-[#E2D9C8]" />

        {/* Reviewer Profile Avatar */}
        <div className="flex items-center gap-2.5" title="Credentialed Reviewer">
          <div className="w-8 h-8 rounded-full bg-[#0B132B] text-white font-serif text-xs font-bold flex items-center justify-center shadow-xs">
            AG
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-[#0B132B] leading-none">
              Admin Guardian
            </span>
            <span className="text-[10px] text-[#64748B] font-mono uppercase tracking-wider mt-0.5">
              SecOps Level 3
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
