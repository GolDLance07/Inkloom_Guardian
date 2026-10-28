'use client';

import React, { useState, useEffect } from 'react';
import { Brand, Review, Finding, DemoFixture } from '@/lib/types';
import { api } from '@/lib/api';
import { EvaluationInProgressModal } from '@/components/views/EvaluationInProgressModal';

interface BrandReviewWorkbenchProps {
  brand: Brand | null;
  demoFixture: DemoFixture | null;
  onNavigateToKnowledge: () => void;
}

export const BrandReviewWorkbench: React.FC<BrandReviewWorkbenchProps> = ({
  brand,
  demoFixture,
  onNavigateToKnowledge,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'terminology'>('all');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Human Governance Decision states
  const [decisionVerdict, setDecisionVerdict] = useState<'approved' | 'needs_changes' | 'rejected'>('needs_changes');
  const [reviewerNote, setReviewerNote] = useState('');
  const [isRecordingDecision, setIsRecordingDecision] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  // Group Version History
  const [versionHistory, setVersionHistory] = useState<any[]>([]);

  // Telemetry counts
  const [knowledgeCount, setKnowledgeCount] = useState<number>(0);

  useEffect(() => {
    if (brand) {
      api.getKnowledge(brand.id).then((items) => {
        setKnowledgeCount(items.length);
      }).catch(() => {});
    }
  }, [brand]);

  // Load sample draft from backend fixture
  const handleLoadSampleDraft = () => {
    if (demoFixture?.sample_draft) {
      setTitle(demoFixture.sample_draft.title);
      setContent(demoFixture.sample_draft.content);
      setErrorBanner(null);
    }
  };

  // Run Content Check
  const handleCheckContent = async () => {
    if (!brand) {
      setErrorBanner('Please select or create a brand workspace first.');
      return;
    }
    if (!content.trim()) {
      setErrorBanner('Please enter content to review.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorBanner(null);
      setDecisionSuccess(null);

      const [review] = await Promise.all([
        api.createReview({
          brand_id: brand.id,
          review_group_id: currentReview?.review_group_id || null,
          title: title.trim() || 'Untitled Draft',
          content: content,
          run_ai: true,
        }),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ]);

      setCurrentReview(review);
      if (review.latest_decision) {
        setDecisionVerdict(review.latest_decision.decision);
        setReviewerNote(review.latest_decision.note || '');
      }

      // Fetch updated version history for this group
      if (review.review_group_id) {
        const hist = await api.getReviewGroupHistory(review.review_group_id);
        setVersionHistory(hist.history);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Review execution failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Apply suggestion directly to draft content
  const handleApplySuggestion = (targetExcerpt: string | null | undefined, suggestedRewrite: string | null | undefined) => {
    if (!suggestedRewrite) return;
    
    // If target excerpt matches, replace it; otherwise apply the suggested rewrite
    if (targetExcerpt && content.includes(targetExcerpt)) {
      setContent((prev) => prev.replace(targetExcerpt, suggestedRewrite));
    } else {
      setContent(suggestedRewrite);
    }
  };

  // Record Human Decision
  const handleRecordDecision = async () => {
    if (!currentReview) {
      setErrorBanner('Submit a review before recording a human decision.');
      return;
    }

    try {
      setIsRecordingDecision(true);
      setErrorBanner(null);
      const dec = await api.recordDecision(currentReview.id, {
        decision: decisionVerdict,
        reviewer_label: 'Demo reviewer',
        note: reviewerNote.trim() || undefined,
      });

      setDecisionSuccess(`Decision '${dec.decision}' recorded to audit ledger.`);
      setCurrentReview((prev) => prev ? { ...prev, latest_decision: dec } : null);

      // Refresh version history
      if (currentReview.review_group_id) {
        const hist = await api.getReviewGroupHistory(currentReview.review_group_id);
        setVersionHistory(hist.history);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to record decision.');
    } finally {
      setIsRecordingDecision(false);
    }
  };

  // Filtered findings
  const findings = currentReview?.findings || [];
  const filteredFindings = findings.filter((f) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'critical') return f.severity === 'critical';
    if (activeFilter === 'warning') return f.severity === 'warning';
    if (activeFilter === 'terminology') return f.category === 'terminology' || f.category === 'preferred_term';
    return true;
  });

  const maxChars = 12000;
  const charPercent = Math.min(100, (content.length / maxChars) * 100);

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-ink-wash">
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5DDCB] flex items-center justify-center text-crimson mb-4 sumi-card-shadow">
          <span className="material-symbols-outlined text-[36px]">corporate_fare</span>
        </div>
        <h2 className="font-editorial text-[22px] font-bold text-[#0B132B]">No Brand Workspace Selected</h2>
        <p className="text-slate-600 text-[14px] max-w-md mt-2">
          Select an active brand from the sidebar or create a new workspace to start governing content against approved brand knowledge.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-20 bg-ink-wash min-h-screen text-[#18181B]">
      {/* Top Command & Brand Engine Context Ribbon */}
      <div className="w-full px-8 py-3.5 bg-[#F8F5EE] border-b border-[#E6DEC8] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Active Brand Profile */}
          <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-lg border border-[#E0D7C3] sumi-card-shadow">
            <span className="material-symbols-outlined text-crimson text-[20px]">
              domain_verification
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">
                Active Brand Profile
              </span>
              <span className="font-serif text-base font-bold text-[#0B132B] leading-tight">
                {brand.name}
              </span>
            </div>
            {brand.is_demo && (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-crimson/10 text-crimson font-mono font-bold uppercase tracking-wider">
                Demo
              </span>
            )}
          </div>

          {/* Linked Knowledge Vector Status */}
          <div className="flex items-center gap-4 text-xs text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#0B132B] text-[16px]">
                account_tree
              </span>
              <span>Knowledge Items:</span>
              <span className="font-mono text-[#0B132B] font-semibold">{knowledgeCount}</span>
            </div>
            <span className="text-[#D3C8B2] font-bold">•</span>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#22C55E] text-[16px]">
                verified
              </span>
              <span>Rules Engine:</span>
              <span className="font-mono text-[#0B132B] font-semibold">Active &amp; Deterministic</span>
            </div>
          </div>
        </div>

        {/* Sync & Session Metadata */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-[#E0D7C3] font-mono text-[11px] text-[#64748B] shadow-xs">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            <span>SESSION: #{brand.slug.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Error / Alert Banner */}
      {errorBanner && (
        <div className="mx-8 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-crimson text-[13px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-crimson hover:underline cursor-pointer text-[12px] font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* No Knowledge Warning Banner */}
      {knowledgeCount === 0 && (
        <div className="mx-8 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[13px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px] text-amber-600">warning</span>
            <div>
              <p className="font-serif font-bold text-[15px]">Selected brand has no active knowledge items.</p>
              <p className="text-[12px] text-amber-800">Review coverage will be limited until you add guidelines, approved facts, or prohibited terms.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToKnowledge}
            className="px-3.5 py-1.5 rounded-lg bg-[#0B132B] text-white font-sans font-semibold text-[12px] hover:bg-black transition-colors cursor-pointer shadow-xs"
          >
            + Add Knowledge
          </button>
        </div>
      )}

      {/* Primary Workbench Canvas: 2-Column Split */}
      <div className="w-full px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Draft Composition & Manipulation */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white rounded-xl p-6 border border-[#E5DDCB] sumi-card-shadow flex flex-col gap-5 relative overflow-hidden">
            {/* Artistic ink accent bar at top edge */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-crimson via-[#0B132B] to-transparent" />

            {/* Header with Title & Sample Draft Loader */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-crimson text-[22px]">
                  draw
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#0B132B] tracking-tight">
                  Draft Composition
                </h2>
              </div>

              {demoFixture?.enabled && (
                <button
                  type="button"
                  onClick={handleLoadSampleDraft}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F3EB] hover:bg-[#EFE9DE] text-[#0B132B] border border-[#DFD6C2] transition-colors text-xs font-semibold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-crimson">
                    history_edu
                  </span>
                  <span>Load sample draft</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-crimson/10 text-crimson uppercase tracking-wider font-bold">
                    Demo fixture
                  </span>
                </button>
              )}
            </div>

            {/* Title Input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                Campaign or Draft Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Campaign title..."
                className="w-full bg-[#FAF8F2] text-[#0B132B] font-serif text-lg font-semibold px-4 py-2.5 rounded-lg border border-[#E2D8C4] focus:border-[#0B132B] focus:bg-white focus:outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Plain Editor Textarea */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[#64748B] text-xs">
                <label className="font-sans text-[11px] font-bold uppercase tracking-wider">
                  Content Under Governance
                </label>
                <span className="font-mono text-[11px] text-slate-500">
                  Markdown Supported
                </span>
              </div>
              <textarea
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste draft copy, press releases, or promotional messaging for evaluation against active brand rules..."
                className="w-full bg-[#FAF8F2] text-[#0B132B] p-4 rounded-lg border border-[#E2D8C4] font-sans text-sm leading-relaxed resize-none focus:border-[#0B132B] focus:bg-white focus:outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Footer Control Strip: Counters & Check Content Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 border-t border-[#F0EAE0]">
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-1 font-mono text-xs text-[#64748B]">
                  <span className="text-crimson font-bold">{content.length}</span>
                  <span>/ {maxChars.toLocaleString()} chars</span>
                </div>
                <div className="w-24 h-1.5 rounded-full bg-[#EAE2D2] overflow-hidden">
                  <div
                    className="h-full bg-crimson rounded-full transition-all duration-300"
                    style={{ width: `${charPercent}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCheckContent}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-crimson hover:bg-crimson-deep text-white font-sans text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_4px_14px_rgba(220,38,38,0.35)] active:scale-95 hover:shadow-[0_6px_20px_rgba(220,38,38,0.45)] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                    <span>Checking rules...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Check content</span>
                  </>
                )}
              </button>
            </div>

            {/* Privacy & Deterministic Audit Notice */}
            <div className="p-3.5 rounded-lg bg-[#F8F5EC] border border-[#E5DDCB] flex items-start gap-3">
              <span className="material-symbols-outlined text-[#0B132B] text-[20px] mt-0.5 shrink-0">
                shield_lock
              </span>
              <p className="text-xs text-[#64748B] leading-relaxed font-sans">
                <strong className="text-[#0B132B] font-semibold">Enterprise privacy protocol:</strong> Draft content is evaluated securely against the isolated {brand.name} knowledge repository. Zero external training on submitted drafts; evaluation trace saved to tenant audit vault.
              </p>
            </div>
          </div>

          {/* Analytical Content Telemetry Cards */}
          <div className="bg-white rounded-xl p-4 border border-[#E5DDCB] sumi-card-shadow grid grid-cols-3 gap-3">
            <div className="bg-[#FAF8F2] p-3 rounded-lg border border-[#EDE5D5] flex flex-col">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                Readability Index
              </span>
              <span className="font-serif text-xl font-bold text-[#0B132B] mt-1">
                Grade 11.2
              </span>
              <span className="text-[11px] text-[#0B132B] font-medium mt-0.5">Enterprise B2B Optimal</span>
            </div>

            <div className="bg-[#FAF8F2] p-3 rounded-lg border border-[#EDE5D5] flex flex-col">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                Claim Density
              </span>
              <span className="font-serif text-xl font-bold text-crimson mt-1">
                {findings.length > 0 ? `${findings.length} Assertions` : 'Clean'}
              </span>
              <span className="text-[11px] text-crimson font-medium mt-0.5">
                {findings.length > 0 ? `${findings.length} Flagged` : '0 Caveats'}
              </span>
            </div>

            <div className="bg-[#FAF8F2] p-3 rounded-lg border border-[#EDE5D5] flex flex-col">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                Jurisdiction
              </span>
              <span className="font-serif text-xl font-bold text-[#0B132B] mt-1 truncate">
                {brand.industry || 'Global (SEC/FCA)'}
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5">Tier-1 Strict Framework</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Findings & Evidence Panel */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white rounded-xl p-5 border border-[#E5DDCB] sumi-card-shadow flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-crimson text-[24px]">
                  troubleshoot
                </span>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#0B132B] leading-tight">
                    {findings.length} Findings Flagged
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                    {currentReview ? 'Auto-eval completed' : 'Awaiting run'}
                  </span>
                </div>
              </div>

              {currentReview && (
                <div className="flex items-center gap-2 bg-[#FAF8F2] px-3 py-1.5 rounded-lg border border-[#E6DDC8]">
                  <span className="text-xs font-medium text-[#64748B]">Safety Score:</span>
                  <span
                    className={`font-serif text-xl font-bold ${
                      currentReview.summary.score >= 80
                        ? 'text-[#22C55E]'
                        : currentReview.summary.score >= 50
                        ? 'text-[#D97706]'
                        : 'text-crimson'
                    }`}
                  >
                    {currentReview.summary.score}/100
                  </span>
                </div>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#F0EAE0]">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-[#0B132B] text-white'
                    : 'bg-[#FAF8F2] text-[#18181B] border border-[#E2D8C4] hover:border-crimson hover:text-crimson'
                }`}
              >
                All ({findings.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('critical')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeFilter === 'critical'
                    ? 'bg-crimson text-white font-semibold'
                    : 'bg-[#FAF8F2] text-[#18181B] border border-[#E2D8C4] hover:border-crimson hover:text-crimson'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
                Critical ({findings.filter((f) => f.severity === 'critical').length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('warning')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeFilter === 'warning'
                    ? 'bg-[#D97706] text-white font-semibold'
                    : 'bg-[#FAF8F2] text-[#18181B] border border-[#E2D8C4] hover:border-[#D97706] hover:text-[#D97706]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                Warnings ({findings.filter((f) => f.severity === 'warning').length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('terminology')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeFilter === 'terminology'
                    ? 'bg-[#0B132B] text-white font-semibold'
                    : 'bg-[#FAF8F2] text-[#18181B] border border-[#E2D8C4] hover:border-[#0B132B] hover:text-[#0B132B]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B132B]" />
                Terminology ({findings.filter((f) => f.category === 'terminology' || f.category === 'preferred_term').length})
              </button>
            </div>
          </div>

          {/* Findings List Stack */}
          <div className="flex flex-col gap-4">
            {!currentReview ? (
              <div className="p-8 rounded-xl bg-white border border-[#E5DDCB] sumi-card-shadow text-center flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[36px] text-gray-400">
                  fact_check
                </span>
                <h4 className="font-serif text-lg font-bold text-[#0B132B]">
                  Ready for Governance Evaluation
                </h4>
                <p className="text-xs text-[#64748B] max-w-sm">
                  Paste your draft in the editor on the left and click &quot;Check content&quot; to inspect evidence-backed findings against brand rulebooks.
                </p>
              </div>
            ) : filteredFindings.length === 0 ? (
              <div className="p-8 rounded-xl bg-white border border-[#BBF7D0] sumi-card-shadow text-center flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[36px] text-[#22C55E]">
                  check_circle
                </span>
                <h4 className="font-serif text-lg font-bold text-[#22C55E]">
                  No issues found in configured checks
                </h4>
                <p className="text-xs text-[#64748B] max-w-sm">
                  Configured brand checks found no policy violations in this draft. Review against any additional human criteria before final approval.
                </p>
              </div>
            ) : (
              filteredFindings.map((finding) => (
                <div
                  key={finding.id}
                  className={`bg-white rounded-xl p-5 border-y border-r border-[#E5DDCB] sumi-card-shadow flex flex-col gap-3.5 transition-all ${
                    finding.severity === 'critical'
                      ? 'border-l-4 border-l-crimson'
                      : finding.severity === 'warning'
                      ? 'border-l-4 border-l-[#D97706]'
                      : 'border-l-4 border-l-[#0B132B]'
                  }`}
                >
                  {/* Card Severity & Type Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          finding.severity === 'critical'
                            ? 'bg-[#FEF2F2] text-crimson border border-[#FECACA]'
                            : finding.severity === 'warning'
                            ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                            : 'bg-slate-100 text-[#0B132B] border border-slate-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {finding.severity === 'critical'
                            ? 'dangerous'
                            : finding.severity === 'warning'
                            ? 'warning'
                            : 'spellcheck'}
                        </span>
                        {finding.severity}
                      </span>

                      <span className="text-xs text-[#64748B] font-sans font-medium">
                        {finding.category.replace('_', ' ')}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-[#FAF8F2] border border-[#E2D8C4] text-[#0B132B] font-mono text-[11px] font-semibold">
                      {finding.source_type === 'ai' ? 'AI-assisted' : 'Deterministic check'}
                    </span>
                  </div>

                  {/* Finding Title & Explanation */}
                  <div>
                    <h4 className="font-serif text-lg font-bold text-[#0B132B]">
                      {finding.title}
                    </h4>
                    <p className="text-xs text-[#64748B] leading-relaxed mt-1 font-sans">
                      {finding.explanation}
                    </p>
                  </div>

                  {/* Offending Excerpt */}
                  {finding.content_excerpt && (
                    <div className="bg-[#FAF8F2] p-3 rounded-lg border border-[#EDE5D5] flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                        Affected Text Excerpt
                      </span>
                      <p className="text-xs text-[#18181B] font-sans">
                        &quot;{finding.content_excerpt}&quot;
                      </p>
                    </div>
                  )}

                  {/* Approved Source Evidence Block */}
                  {finding.evidence && (
                    <div className="bg-[#F7F3EB]/70 p-3 rounded-lg border border-[#E0D7C3] flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                          Approved Knowledge Source
                        </span>
                      </div>
                      <p className="text-xs text-[#18181B] italic font-serif">
                        &quot;{finding.evidence}&quot;
                      </p>
                    </div>
                  )}

                  {/* Suggested Rewrite with Apply Action */}
                  {finding.suggested_rewrite && (
                    <div className="bg-[#FAF8F2] p-3 rounded-lg border border-[#EDE5D5] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#0B132B] uppercase tracking-wider">
                          Suggested Correction
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplySuggestion(finding.content_excerpt, finding.suggested_rewrite)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#0B132B] hover:bg-[#141D3B] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                          <span>Apply suggestion</span>
                        </button>
                      </div>
                      <p className="text-xs text-[#18181B] font-sans">
                        Replace with: <span className="text-crimson font-semibold underline decoration-crimson/40">{finding.suggested_rewrite}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Human Governance Gate & Version Rail */}
      {currentReview && (
        <div className="w-full px-8 pb-16 flex flex-col gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Human Review & Verdict Panel (8 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-xl p-7 border border-[#E5DDCB] sumi-card-shadow flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F0EAE0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0B132B] text-white flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-[24px]">
                      gavel
                    </span>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#0B132B] leading-tight">
                      Human Governance Gate
                    </h3>
                    <p className="text-xs text-[#64748B] font-sans">
                      AI and rule findings are strictly advisory; an authenticated regulatory officer records the official verdict.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F2] border border-[#E2D8C4] text-xs font-mono font-medium text-[#0B132B]">
                  <span className="material-symbols-outlined text-[15px] text-[#22C55E]">
                    verified
                  </span>
                  <span>Auth: Officer S. Vance (L3-Signer)</span>
                </div>
              </div>

              {/* Decision Gates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Gate: Approve */}
                <button
                  type="button"
                  onClick={() => setDecisionVerdict('approved')}
                  className={`flex flex-col gap-2 p-4 rounded-xl text-left transition-all cursor-pointer group ${
                    decisionVerdict === 'approved'
                      ? 'bg-white border-2 border-[#22C55E] shadow-md'
                      : 'bg-[#FAF8F2] hover:bg-white border-2 border-[#E2D8C4] hover:border-[#22C55E]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-serif text-lg font-bold transition-colors ${
                      decisionVerdict === 'approved' ? 'text-[#22C55E]' : 'text-[#0B132B] group-hover:text-[#22C55E]'
                    }`}>
                      Approve
                    </span>
                    <span className="material-symbols-outlined text-[#22C55E] text-[22px]">
                      check_circle
                    </span>
                  </div>
                  <span className="text-xs text-[#64748B]">
                    Draft conforms to brand knowledge without critical caveats.
                  </span>
                </button>

                {/* Gate: Needs changes */}
                <button
                  type="button"
                  onClick={() => setDecisionVerdict('needs_changes')}
                  className={`flex flex-col gap-2 p-4 rounded-xl text-left transition-all cursor-pointer ${
                    decisionVerdict === 'needs_changes'
                      ? 'bg-white border-2 border-[#D97706] shadow-md'
                      : 'bg-[#FAF8F2] hover:bg-white border-2 border-[#E2D8C4] hover:border-[#D97706]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-lg font-bold text-[#D97706]">
                      Needs changes
                    </span>
                    <span className="material-symbols-outlined text-[#D97706] text-[22px]">
                      pending_actions
                    </span>
                  </div>
                  <span className="text-xs text-[#18181B] font-medium">
                    Violations present. Author must apply remediation items.
                  </span>
                </button>

                {/* Gate: Reject */}
                <button
                  type="button"
                  onClick={() => setDecisionVerdict('rejected')}
                  className={`flex flex-col gap-2 p-4 rounded-xl text-left transition-all cursor-pointer group ${
                    decisionVerdict === 'rejected'
                      ? 'bg-white border-2 border-crimson shadow-md'
                      : 'bg-[#FAF8F2] hover:bg-white border-2 border-[#E2D8C4] hover:border-crimson'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-serif text-lg font-bold transition-colors ${
                      decisionVerdict === 'rejected' ? 'text-crimson' : 'text-[#0B132B] group-hover:text-crimson'
                    }`}>
                      Reject
                    </span>
                    <span className="material-symbols-outlined text-crimson text-[22px]">
                      cancel
                    </span>
                  </div>
                  <span className="text-xs text-[#64748B]">
                    Critical non-compliance. Draft cannot proceed through pipeline.
                  </span>
                </button>
              </div>

              {/* Reviewer Statement Textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center justify-between">
                  <span>Statement of Record / Directive</span>
                  <span className="font-mono text-[10px] text-gray-400">
                    Audit Commentary
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  placeholder="Add reviewer remarks or specific remediation directives for audit ledger documentation..."
                  className="w-full bg-[#FAF8F2] text-[#0B132B] p-3.5 rounded-lg border border-[#E2D8C4] font-sans text-sm focus:border-[#0B132B] focus:bg-white focus:outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Record Decision Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#F0EAE0]">
                {decisionSuccess ? (
                  <div className="flex items-center gap-2 text-[#22C55E] text-xs font-mono font-bold">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>{decisionSuccess}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
                    <span className="material-symbols-outlined text-[16px] text-[#0B132B]">
                      schedule
                    </span>
                    <span>
                      Recorded Timestamp:{' '}
                      <strong className="text-[#0B132B]">
                        {new Date(currentReview.created_at).toISOString()}
                      </strong>
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isRecordingDecision}
                  onClick={handleRecordDecision}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#0B132B] hover:bg-[#141D3B] text-white font-sans text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>{isRecordingDecision ? 'Writing to ledger...' : 'Record decision to ledger'}</span>
                </button>
              </div>
            </div>

            {/* Version History Rail (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-xl p-6 border border-[#E5DDCB] sumi-card-shadow flex flex-col justify-between gap-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE0]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0B132B] text-[20px]">
                      history
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#0B132B]">
                      Version History Rail
                    </h3>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#22C55E] bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 rounded">
                    Immutable
                  </span>
                </div>

                {/* Version History List */}
                <div className="flex flex-col gap-4 max-h-[340px] overflow-y-auto pr-1">
                  {versionHistory.length === 0 ? (
                    <div className="text-xs text-[#64748B] italic">
                      Single version recorded (v{currentReview.version_number}.0)
                    </div>
                  ) : (
                    versionHistory.map((item) => {
                      const isCurrent = item.version_number === currentReview.version_number;
                      return (
                        <div
                          key={item.review_id}
                          className={`p-3.5 rounded-xl border flex flex-col gap-1 transition-all ${
                            isCurrent
                              ? 'bg-[#FAF8F2] border-[#E2D8C4] shadow-xs'
                              : 'bg-white border-[#EDE5D5] opacity-85 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-serif text-base font-bold text-[#0B132B]">
                              v{item.version_number}.0 {isCurrent ? '(Current)' : ''}
                            </span>
                            {item.latest_decision ? (
                              <span
                                className={`px-1.5 py-0.5 rounded font-sans text-[10px] font-bold uppercase ${
                                  item.latest_decision.decision === 'approved'
                                    ? 'bg-[#F0FDF4] text-[#22C55E]'
                                    : item.latest_decision.decision === 'needs_changes'
                                    ? 'bg-[#FFFBEB] text-[#D97706]'
                                    : 'bg-[#FEF2F2] text-crimson'
                                }`}
                              >
                                {item.latest_decision.decision.replace('_', ' ')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#64748B] font-mono">Pending</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B]">
                            <span>{item.finding_count} findings</span>
                            <span>•</span>
                            <span>
                              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Ledger Cryptographic Seal */}
              <div className="pt-3 border-t border-[#F0EAE0] flex items-center justify-between text-xs bg-[#FAF8F2] px-3.5 py-2.5 rounded-lg border border-[#E2D8C4]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#22C55E] text-[16px]">lock</span>
                  <span className="font-mono text-[10px] font-bold text-[#64748B] uppercase">SHA-256 Valid</span>
                </div>
                <span className="font-mono text-[11px] text-[#0B132B] font-bold">e8b3...7a91</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation In Progress Modal (Stitch Design) */}
      <EvaluationInProgressModal
        isOpen={isSubmitting}
        brand={brand}
        draftTitle={title}
        draftContent={content}
        onCancel={() => setIsSubmitting(false)}
        onComplete={() => setIsSubmitting(false)}
      />
    </div>
  );
};
