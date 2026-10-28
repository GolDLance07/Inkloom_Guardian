'use client';

import React, { useState, useEffect } from 'react';

interface InitialLoadingScreenProps {
  onComplete: () => void;
  brandName?: string;
  isDataReady?: boolean;
}

export const InitialLoadingScreen: React.FC<InitialLoadingScreenProps> = ({
  onComplete,
  brandName = 'Acme Enterprise Core',
  isDataReady = true,
}) => {
  const [progress, setProgress] = useState(12);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<Array<{ time: string; text: string; status: 'ok' | 'scan' | 'active' }>>([
    { time: '00:00.04', text: 'Initializing tenant sandbox container: tenant_inkloom_sovereign', status: 'ok' },
  ]);

  const steps = [
    'Initializing sovereign daemon connection [node: us-east-04 air-gapped]',
    'Mounting immutable cryptographic audit ledger (SHA-256 genesis block)',
    'Synchronizing brand knowledge repository & rulebook vectors',
    'Activating deterministic lexical tokenizer & Gemini Flash AI reasoning core',
    'Sovereign fiduciary governance workbench secured & operational',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const delta = Math.floor(Math.random() * 14) + 8;
        const next = Math.min(100, prev + delta);
        return next;
      });
    }, 180);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 25 && currentStep < 1) {
      setCurrentStep(1);
      setLogs((l) => [
        ...l,
        { time: '00:00.32', text: 'Audit Ledger hash verified: 0x7f81c9a0328d...e8b37a91', status: 'ok' },
      ]);
    } else if (progress >= 50 && currentStep < 2) {
      setCurrentStep(2);
      setLogs((l) => [
        ...l,
        { time: '00:00.68', text: `Loaded knowledge base vectors for ${brandName}: 142 deterministic rules cached`, status: 'ok' },
      ]);
    } else if (progress >= 75 && currentStep < 3) {
      setCurrentStep(3);
      setLogs((l) => [
        ...l,
        { time: '00:01.05', text: 'Gemini 3.6 Flash reasoning core linked with zero-budget deterministic bounds', status: 'ok' },
      ]);
    } else if (progress >= 100 && currentStep < 4) {
      setCurrentStep(4);
      setLogs((l) => [
        ...l,
        { time: '00:01.40', text: 'All 5 sovereign governance guardrails authenticated. Workbench ready.', status: 'active' },
      ]);
    }
  }, [progress, currentStep, brandName]);

  // Auto-complete when 100% and data is ready
  useEffect(() => {
    if (progress === 100 && isDataReady) {
      const exitTimer = setTimeout(() => {
        onComplete();
      }, 700);
      return () => clearTimeout(exitTimer);
    }
  }, [progress, isDataReady, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#070C1E] text-white flex flex-col items-center justify-between p-6 sm:p-12 overflow-hidden selection:bg-crimson selection:text-white">
      {/* Background sumi wash & radial lighting glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#1C2C5A]/40 via-crimson/15 to-transparent blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-[#DC2626]/20 via-[#0B132B]/80 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] rounded-full bg-[#10B981]/10 blur-3xl" />
      </div>

      {/* Top Header Status Bar */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between border-b border-[#1A2854] pb-4 font-mono text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-gray-200 font-semibold tracking-wider uppercase">Boot Sequence // Node 04</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-gray-500">Tier: Sovereign Enterprise v4.2</span>
          <button
            onClick={onComplete}
            className="text-gray-400 hover:text-white hover:underline transition-colors cursor-pointer text-[11px]"
          >
            Skip to Workbench →
          </button>
        </div>
      </div>

      {/* Central Identity & Progress Card */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center my-auto">
        {/* Animated Sovereign Shield Emblem */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0B132B] to-[#152044] border-2 border-crimson/80 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.45)] relative group">
            <span className="material-symbols-outlined text-[44px] text-white">
              shield_lock
            </span>
            <div className="absolute -inset-1 rounded-2xl border border-red-500/40 animate-ping pointer-events-none" />
          </div>
          {/* Subtle orbital pill */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#070C1E] px-2.5 py-0.5 rounded-full border border-crimson/60 shadow-xs">
            <span className="font-mono text-[9px] uppercase tracking-widest text-red-400 font-bold">
              SECURED
            </span>
          </div>
        </div>

        {/* Wordmark & Subtitle */}
        <h1 className="font-editorial text-4xl sm:text-5xl font-bold tracking-tight text-white mb-2 italic">
          Inkloom Guardian
        </h1>
        <p className="font-sans text-sm sm:text-base text-gray-400 max-w-lg mb-8 leading-relaxed">
          Brand-Agnostic Content Governance Workbench with Deterministic Rule Enforcement &amp; Sovereign Audit Logging
        </p>

        {/* Live Progress Bar Container */}
        <div className="w-full bg-[#0B132B] p-5 rounded-2xl border border-[#1C2C5A] shadow-xl flex flex-col gap-4 text-left">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-gray-300 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
              {steps[currentStep]}
            </span>
            <span className="text-red-400 font-bold text-sm">
              {progress}%
            </span>
          </div>

          {/* Bar track & fill */}
          <div className="w-full h-2.5 bg-[#070C1E] rounded-full overflow-hidden p-0.5 border border-[#17254C]">
            <div
              className="h-full bg-gradient-to-r from-crimson via-red-500 to-[#10B981] rounded-full transition-all duration-200 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/25 animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>

          {/* 5-Step Pipeline Checkpoint Badges */}
          <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-[#152044]">
            {steps.map((s, idx) => {
              const isDone = idx < currentStep;
              const isActive = idx === currentStep;
              return (
                <div
                  key={idx}
                  className={`flex flex-col gap-1 p-1.5 rounded transition-colors ${
                    isDone
                      ? 'bg-emerald-950/40 border border-emerald-700/50 text-emerald-400'
                      : isActive
                      ? 'bg-red-950/50 border border-crimson text-white animate-pulse'
                      : 'bg-[#070C1E]/50 border border-white/5 text-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold">STAGE 0{idx + 1}</span>
                    <span className="material-symbols-outlined text-[12px]">
                      {isDone ? 'check_circle' : isActive ? 'sync' : 'circle'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monospace Daemon Streaming Log */}
        <div className="w-full mt-4 bg-[#070C1E] rounded-xl border border-[#17254C] p-3 text-left font-mono text-[11px] h-28 overflow-hidden flex flex-col justify-end gap-1.5 text-gray-400 shadow-inner">
          {logs.map((log, index) => (
            <div key={index} className="flex items-center gap-2 truncate">
              <span className="text-gray-600 shrink-0">{log.time}</span>
              <span
                className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                  log.status === 'ok'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-red-950 text-red-300 border border-crimson'
                }`}
              >
                [{log.status.toUpperCase()}]
              </span>
              <span className="truncate text-gray-300">{log.text}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-red-400 animate-pulse pt-0.5">
            <span className="text-gray-600">--:--.--</span>
            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-crimson text-white">[RUNNING]</span>
            <span className="flex items-center gap-1">
              Verifying sovereign guardrails...
              <span className="inline-block w-1.5 h-3 bg-[#10B981] animate-pulse" />
            </span>
          </div>
        </div>

        {/* Enter Button (Appears if user wants manual enter) */}
        {progress === 100 && (
          <button
            onClick={onComplete}
            className="mt-6 px-8 py-3 rounded-xl bg-crimson hover:bg-crimson-deep text-white font-sans text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(220,38,38,0.6)] cursor-pointer flex items-center gap-2 animate-bounce"
          >
            <span>Enter Sovereign Workbench</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        )}
      </div>

      {/* Footer Info Ribbon */}
      <div className="relative z-10 w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 border-t border-[#1A2854] pt-4 font-mono text-[11px] text-gray-500">
        <div className="flex items-center gap-4">
          <span>SHA-256: 7f81c9a0...328d</span>
          <span>•</span>
          <span>Air-Gapped Tenant Mode</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span>Deterministic Integrity Guardrails Active</span>
        </div>
      </div>
    </div>
  );
};
