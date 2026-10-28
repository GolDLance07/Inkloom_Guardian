'use client';

import React, { useState, useEffect } from 'react';
import { Brand } from '@/lib/types';

interface EvaluationInProgressModalProps {
  isOpen: boolean;
  brand: Brand | null;
  draftTitle: string;
  draftContent: string;
  onCancel: () => void;
  onComplete: () => void;
}

export const EvaluationInProgressModal: React.FC<EvaluationInProgressModalProps> = ({
  isOpen,
  brand,
  draftTitle,
  draftContent,
  onCancel,
  onComplete,
}) => {
  const [elapsed, setElapsed] = useState('0.4');
  const [pct, setPct] = useState(34);
  const [isPaused, setIsPaused] = useState(false);
  const [activeStage, setActiveStage] = useState(2); // 0=lexical, 1=rulebook, 2=semantic, 3=disclaimer, 4=dispatch

  useEffect(() => {
    if (!isOpen) return;

    setElapsed('0.4');
    setPct(34);
    setActiveStage(2);
    setIsPaused(false);

    const ticker = setInterval(() => {
      if (!isPaused) {
        setElapsed((prev) => (parseFloat(prev) + 0.1).toFixed(1));
        setPct((p) => {
          if (p >= 96) return 96;
          return p + Math.floor(Math.random() * 4) + 1;
        });
      }
    }, 250);

    return () => clearInterval(ticker);
  }, [isOpen, isPaused]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl bg-[#FAF7F0] text-gray-900 rounded-2xl shadow-2xl border border-[#D9D2C5] overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* TOP STATUS BAR */}
        <div className="bg-[#070C1E] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#1C2C5A]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-crimson animate-ping" />
            <span className="font-mono text-xs font-bold tracking-wider uppercase text-red-400">
              Live Governance Evaluation
            </span>
            <span className="text-gray-600">|</span>
            <span className="font-editorial text-lg italic text-white truncate max-w-md">
              {draftTitle || 'Untitled Draft'}
            </span>
            <span className="hidden sm:inline font-mono text-xs text-gray-400 bg-[#0B132B] px-2 py-0.5 rounded border border-[#1A2854]">
              {brand?.name || 'Acme Enterprise Core'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
              Rulebook v8.14
            </span>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              title="Close modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 bg-ink-wash">
          {/* HEADER CARD: Progress, Status & Active Stage Banner */}
          <div className="w-full bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#E7E0D3] relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#070C1E] text-white font-mono text-[11px] font-semibold tracking-wide shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
                  LIVE EVALUATION
                </span>
                <span className="text-[#C7BFB0]">·</span>
                <span className="font-editorial text-xl font-semibold text-black tracking-tight italic">
                  Evaluating Draft · {brand?.name || 'Sovereign Brand Workspace'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEE2E2] text-[#B91C1C] font-mono text-[11px] font-bold border border-crimson/20">
                  <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
                  STAGE {activeStage + 1} OF 5 RUNNING
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 flex flex-col gap-1.5">
                <h1 className="font-editorial text-2xl sm:text-3xl leading-snug text-black tracking-tight font-semibold">
                  Review Evaluation in Progress
                </h1>
                <p className="text-[13px] text-gray-600 font-sans max-w-2xl leading-relaxed">
                  Executing deterministic fiduciary checks and high-dimensional semantic corroboration against enterprise rulebooks and historical ground-truth indices.
                </p>
              </div>

              <div className="lg:col-span-5 flex items-center justify-start lg:justify-end gap-6 sm:gap-8 bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E0D3]">
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                    Elapsed / Est.
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-editorial text-3xl font-bold text-black leading-none">
                      {elapsed}
                      <span className="text-[18px] font-sans font-normal text-gray-500">s</span>
                    </span>
                    <span className="font-mono text-[12px] text-gray-400 font-normal">/ ~2.4s</span>
                  </div>
                </div>

                <div className="h-10 w-[1px] bg-[#D9D2C5]" />

                <div className="flex flex-col">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-crimson font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
                    Sync Rate
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-editorial text-3xl font-extrabold text-crimson leading-none">
                      {pct}
                    </span>
                    <span className="font-sans text-xl font-bold text-crimson">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Progress Bar */}
            <div className="mt-5 flex flex-col gap-2">
              <div className="w-full bg-[#EAE3D5] h-2.5 rounded-full overflow-hidden p-[2px] relative">
                <div
                  className="bg-gradient-to-r from-[#0B132B] via-crimson to-red-500 h-full rounded-full transition-all duration-300 relative"
                  style={{ width: `${pct}%` }}
                >
                  <div className="absolute inset-0 bg-white/25 animate-[shimmer_2s_infinite]" />
                </div>
              </div>
              <div className="flex justify-between items-center font-mono text-[11px] text-gray-600">
                <span className="flex items-center gap-1.5 font-medium text-black">
                  <span className="material-symbols-outlined text-[15px] text-[#10B981]">check_circle</span>
                  2 Stages Verified
                </span>
                <span className="text-crimson font-semibold tracking-wide animate-pulse">
                  ● Active: Semantic Claim Corroboration
                </span>
                <span className="text-gray-400">2 Stages Pending</span>
              </div>
            </div>
          </div>

          {/* MULTI-STAGE PIPELINE CARDS */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-crimson text-[20px]">account_tree</span>
                <h2 className="font-editorial text-[18px] font-semibold text-black tracking-tight">
                  Execution Sequence Pipeline
                </h2>
              </div>
              <span className="font-mono text-[11px] text-gray-500">Sovereign Proof Engine · DAG-9942</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Stage 1 */}
              <div className="bg-white rounded-lg p-3.5 border border-[#E3DCCE] shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#10B981]" />
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                      0.12s
                    </span>
                  </div>
                  <h3 className="font-editorial text-[15px] font-semibold text-black leading-snug">
                    1. Lexical Token Analysis
                  </h3>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Completed · Prohibited aliases and preferred terminology scanned.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-[#F0EAE0] flex items-center justify-between font-mono text-[10px]">
                  <span className="text-[#10B981] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    PASSED
                  </span>
                  <span className="text-gray-400">#TOKEN_OK</span>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="bg-white rounded-lg p-3.5 border border-[#E3DCCE] shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#10B981]" />
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                      0.45s
                    </span>
                  </div>
                  <h3 className="font-editorial text-[15px] font-semibold text-black leading-snug">
                    2. Knowledge Rulebook
                  </h3>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Completed · Verified against active brand certified facts &amp; disclaimers.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-[#F0EAE0] flex items-center justify-between font-mono text-[10px]">
                  <span className="text-[#10B981] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    VERIFIED
                  </span>
                  <span className="text-gray-400">POL_CORE</span>
                </div>
              </div>

              {/* Stage 3 (ACTIVE CRIMSON BEACON) */}
              <div className="bg-[#0B132B] text-white rounded-lg p-3.5 border-2 border-crimson shadow-[0_4px_20px_rgba(220,38,38,0.22)] flex flex-col justify-between relative overflow-hidden animate-[pulse-glow_2.5s_infinite]">
                <div className="absolute top-0 left-0 right-0 h-[4px] bg-crimson" />
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-crimson text-white flex items-center justify-center shadow-xs shadow-crimson/50 animate-pulse">
                      <span className="material-symbols-outlined text-[13px] font-bold">sync</span>
                    </div>
                    <span className="font-mono text-[10px] text-red-200 bg-crimson/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-crimson/50 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                      SCANNING
                    </span>
                  </div>
                  <h3 className="font-editorial text-[15px] font-semibold text-white leading-snug">
                    3. Semantic Claim Corroboration
                  </h3>
                  <p className="text-[11px] text-gray-300 mt-1 leading-snug">
                    In Progress · Gemini Flash matching claims against approved ground-truth repository.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-[#1C2C5A] flex items-center justify-between font-mono text-[10px]">
                  <span className="text-red-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
                    Analyzing Excerpts
                  </span>
                  <span className="text-gray-400">Cosine 0.94</span>
                </div>
              </div>

              {/* Stage 4 */}
              <div className="bg-[#FAF7F0] rounded-lg p-3.5 border border-[#E3DCCE] opacity-75 flex flex-col justify-between relative">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#D9D2C5]" />
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#EAE3D5] text-gray-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[13px]">hourglass_empty</span>
                    </div>
                    <span className="font-mono text-[10px] text-gray-500 bg-[#EFE9DD] px-1.5 py-0.5 rounded font-medium">
                      Pending
                    </span>
                  </div>
                  <h3 className="font-editorial text-[15px] font-semibold text-gray-800 leading-snug">
                    4. Statutory Disclaimer Scan
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Pending · Mandated risk disclosure boundary verification.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-[#EAE3D5] flex items-center justify-between font-mono text-[10px]">
                  <span className="text-gray-400">Awaiting Stage 3</span>
                  <span className="text-gray-400">--</span>
                </div>
              </div>

              {/* Stage 5 */}
              <div className="bg-[#FAF7F0] rounded-lg p-3.5 border border-[#E3DCCE] opacity-75 flex flex-col justify-between relative">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#D9D2C5]" />
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#EAE3D5] text-gray-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[13px]">verified_user</span>
                    </div>
                    <span className="font-mono text-[10px] text-gray-500 bg-[#EFE9DD] px-1.5 py-0.5 rounded font-medium">
                      Pending
                    </span>
                  </div>
                  <h3 className="font-editorial text-[15px] font-semibold text-gray-800 leading-snug">
                    5. Human Gate Dispatch
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Pending · Cryptographic seal generation &amp; reviewer verdict queue.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-[#EAE3D5] flex items-center justify-between font-mono text-[10px]">
                  <span className="text-gray-400">Gate #5 Queued</span>
                  <span className="text-gray-400">--</span>
                </div>
              </div>
            </div>
          </div>

          {/* SPLIT WORKBENCH: LIVE INSPECTION ARTIFACT + MIDNIGHT STREAMING LOG */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Live Inspection Workbench Artifact */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-[#E3DCCE] shadow-sm overflow-hidden flex flex-col">
              <div className="bg-[#F4EFE6] px-5 py-3 border-b border-[#E3DCCE] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-crimson text-[20px]">document_scanner</span>
                  <div className="flex flex-col">
                    <span className="font-editorial text-[15px] font-bold text-black leading-none">
                      Live Inspection Workbench
                    </span>
                    <span className="font-mono text-[10px] text-gray-500 mt-0.5">
                      Submitted Copy · Active Scan Stream
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FEE2E2] text-[#B91C1C] font-mono text-[10px] font-bold border border-crimson/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
                  SCAN BEAM ACTIVE
                </span>
              </div>

              {/* Scanned Draft Canvas with Laser Beam Animation */}
              <div className="p-5 relative bg-[#FAF7F0] overflow-hidden min-h-[300px] max-h-[340px] overflow-y-auto">
                {/* Sweeping Laser Scan Beam */}
                <div className="absolute inset-x-0 h-14 bg-gradient-to-b from-crimson/0 via-crimson/15 to-crimson/0 pointer-events-none animate-scanline" />
                <div className="absolute inset-x-0 h-[1.5px] bg-crimson/80 pointer-events-none shadow-[0_0_10px_#DC2626] animate-scanline" />

                <div className="relative z-10 flex flex-col gap-3 font-sans text-[13px] leading-relaxed text-gray-800 whitespace-pre-wrap">
                  <div className="pb-2 border-b border-[#E8E1D2] flex items-center justify-between">
                    <span className="font-editorial text-base font-semibold text-black italic">
                      {draftTitle || 'Draft Submission'}
                    </span>
                    <span className="font-mono text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border border-[#E3DCCE]">
                      {draftContent.length} chars
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {draftContent || 'No draft content provided.'}
                  </p>
                </div>
              </div>

              <div className="px-5 py-2 bg-[#F4EFE6] border-t border-[#E3DCCE] flex items-center justify-between font-mono text-[10px] text-gray-500">
                <span>PARSER_THREAD #9942-01</span>
                <span>SHA-256: 7f81c9a0...328d</span>
              </div>
            </div>

            {/* RIGHT: Midnight Dark Real-Time Daemon Verification Log */}
            <div className="lg:col-span-6 bg-[#070C1E] text-white rounded-xl border border-[#17254C] shadow-lg overflow-hidden flex flex-col">
              <div className="bg-[#0B132B] px-5 py-3 border-b border-[#1C2C5A] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-crimson" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  </div>
                  <span className="font-mono text-[11px] text-gray-300 font-semibold tracking-wide">
                    inkloom-guardian-daemon // live-verification-stream
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#102047] text-emerald-400 font-mono text-[10px] border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                  STREAM: 5.4 msg/s
                </span>
              </div>

              <div className="p-4 font-mono text-[11px] flex flex-col gap-2 h-[300px] max-h-[340px] overflow-y-auto bg-[#070C1E] leading-relaxed">
                <div className="flex items-start gap-2 text-gray-400">
                  <span className="text-gray-500">14:02:11.104</span>
                  <span className="px-1 py-0.2 rounded bg-emerald-950 text-[#10B981] border border-emerald-800/60 font-bold text-[9px]">
                    [OK]
                  </span>
                  <span className="text-gray-200">
                    Session token verified · <span className="text-cyan-300">sess_guardian_{brand?.name?.toLowerCase().replace(/\s+/g, '_') || 'core'}</span>
                  </span>
                </div>

                <div className="flex items-start gap-2 text-gray-400">
                  <span className="text-gray-500">14:02:11.238</span>
                  <span className="px-1 py-0.2 rounded bg-emerald-950 text-[#10B981] border border-emerald-800/60 font-bold text-[9px]">
                    [OK]
                  </span>
                  <span className="text-gray-200">
                    Ingested draft · {draftContent.length} chars partitioned into semantic spans
                  </span>
                </div>

                <div className="flex items-start gap-2 text-gray-400">
                  <span className="text-gray-500">14:02:11.412</span>
                  <span className="px-1 py-0.2 rounded bg-emerald-950 text-[#10B981] border border-emerald-800/60 font-bold text-[9px]">
                    [OK]
                  </span>
                  <span className="text-gray-200">
                    Lexical Token Scan completed in 120ms (0 prohibited terms detected)
                  </span>
                </div>

                <div className="flex items-start gap-2 text-gray-400">
                  <span className="text-gray-500">14:02:11.750</span>
                  <span className="px-1 py-0.2 rounded bg-emerald-950 text-[#10B981] border border-emerald-800/60 font-bold text-[9px]">
                    [OK]
                  </span>
                  <span className="text-gray-200">
                    Deterministic Rulebook: rules evaluated against {brand?.name || 'Acme'} v8.14
                  </span>
                </div>

                <div className="flex items-start gap-2 bg-red-950/30 p-1.5 rounded border border-red-900/40">
                  <span className="text-gray-500">14:02:12.180</span>
                  <span className="px-1 py-0.2 rounded bg-crimson text-white font-bold text-[9px] shadow-xs">
                    [EVAL]
                  </span>
                  <span className="text-red-300">
                    Executing high-dimensional Gemini Flash reasoning over active knowledge vectors
                  </span>
                </div>

                <div className="flex items-start gap-2 text-white animate-pulse">
                  <span className="text-gray-500">14:02:12.890</span>
                  <span className="px-1 py-0.2 rounded bg-crimson text-white font-bold text-[9px]">
                    [ACTIVE]
                  </span>
                  <span className="text-red-400 flex items-center gap-1.5">
                    Corroborating claims with sovereign ledger
                    <span className="inline-block w-2 h-3.5 bg-[#10B981] animate-pulse" />
                  </span>
                </div>
              </div>

              <div className="bg-[#0B132B] px-5 py-2.5 border-t border-[#1C2C5A] flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] text-gray-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Memory:</span>
                    <span className="text-white font-semibold">418 MB</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Latency:</span>
                    <span className="text-emerald-400 font-semibold">{elapsed}s</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="material-symbols-outlined text-[13px]">lock</span>
                  <span>Ledger Proof Intact</span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM CONTROLS FOOTER */}
          <div className="w-full bg-white rounded-xl p-4 border border-[#E3DCCE] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                <span className="font-mono text-xs font-semibold text-black">
                  Daemon Node: us-east-04 (Air-gapped)
                </span>
              </div>
              <span className="text-[#D9D2C5] hidden sm:inline">|</span>
              <span className="text-xs text-gray-600">
                Deterministic Fiduciary Audit Pipeline · Level 4 Enterprise Assurance
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="px-3.5 py-1.5 rounded-lg bg-[#FAF7F0] hover:bg-[#EFE9DD] border border-[#D9D2C5] text-black text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] text-gray-700">
                  {isPaused ? 'play_arrow' : 'pause'}
                </span>
                <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-1.5 rounded-lg bg-crimson hover:bg-crimson-deep text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-crimson/25 active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>Cancel Evaluation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
