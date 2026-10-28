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
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-obsidian/90 backdrop-blur-xl z-40 flex items-center justify-between px-8 border-b border-border-subtle shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
      {/* Status Badges */}
      <div className="flex items-center gap-3">
        {/* API Status */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-display font-medium ${
            isApiConnected
              ? 'bg-electric-lime-muted text-electric-lime border border-electric-lime/40'
              : 'bg-critical-red-surface text-critical-red border border-critical-red/40'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isApiConnected ? 'bg-electric-lime animate-pulse' : 'bg-critical-red'
            }`}
          />
          <span>{isApiConnected ? 'API connected' : 'API disconnected'}</span>
        </div>

        {/* AI Engine Status */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-graphite text-text-mist text-[12px] font-display border border-border-subtle">
          <span className="material-symbols-outlined text-[16px] text-info-cyan">
            {isAiActive ? 'neurology' : 'rule'}
          </span>
          <span>
            {isAiActive
              ? 'AI enabled / Rules engine active'
              : 'Deterministic Rules-only mode active'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {selectedBrand ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-surface-graphite border border-border-subtle text-[12px] font-display text-text-mist">
            <span className="text-text-muted">Scope:</span>
            <span className="font-semibold text-electric-lime truncate max-w-[180px]">
              {selectedBrand.name}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenCreateBrand}
            className="px-3 py-1 rounded-lg bg-electric-lime text-surface-obsidian font-display text-[12px] font-semibold hover:bg-white transition-colors cursor-pointer"
          >
            + Create Workspace
          </button>
        )}

        <div className="h-4 w-px bg-border-subtle" />

        {/* Reviewer Profile Avatar */}
        <div className="flex items-center gap-2" title="Credentialed Reviewer">
          <div className="w-8 h-8 rounded-full bg-surface-graphite-elevated border border-border-subtle flex items-center justify-center text-electric-lime">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-[12px] font-medium text-text-mist leading-none">
              Demo Reviewer
            </span>
            <span className="text-[10px] text-text-muted font-display uppercase tracking-wider">
              Governance Lead
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
