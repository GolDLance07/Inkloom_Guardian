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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-graphite border border-border-subtle flex items-center justify-center text-electric-lime mb-4">
          <span className="material-symbols-outlined text-[36px]">corporate_fare</span>
        </div>
        <h2 className="font-display text-[22px] font-bold text-text-mist">No Brand Workspace Selected</h2>
        <p className="text-text-muted text-[14px] max-w-md mt-2">
          Select an active brand from the sidebar or create a new workspace to start governing content against approved brand knowledge.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Top Command & Brand Engine Context Ribbon */}
      <div className="w-full px-8 py-3 bg-surface-container-lowest border-b border-border-subtle flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Active Brand Profile */}
          <div className="flex items-center gap-3 bg-surface-graphite px-4 py-1.5 rounded-lg border border-border-subtle">
            <span className="material-symbols-outlined text-electric-lime text-[18px]">
              domain_verification
            </span>
            <div className="flex flex-col">
              <span className="font-display text-[10px] text-text-muted uppercase tracking-wider">
                Active Brand Profile
              </span>
              <span className="font-display text-[14px] text-text-mist font-semibold">
                {brand.name}
              </span>
            </div>
            {brand.is_demo && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-electric-lime-muted text-electric-lime font-display font-semibold uppercase">
                Demo
              </span>
            )}
          </div>

          {/* Linked Knowledge Vector Status */}
          <div className="flex items-center gap-4 text-text-muted text-[13px] font-display">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-info-cyan text-[16px]">
                account_tree
              </span>
              <span>Knowledge Items:</span>
              <span className="text-text-mist font-semibold">{knowledgeCount}</span>
            </div>
            <span className="text-border-strong font-bold">•</span>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-electric-lime text-[16px]">
                verified
              </span>
              <span>Rules Engine:</span>
              <span className="text-text-mist font-semibold">Active & Deterministic</span>
            </div>
          </div>
        </div>

        {/* Sync & Session Metadata */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-graphite px-3 py-1 rounded-full border border-border-subtle font-display text-[11px] text-text-mist">
            <span className="inline-block w-2 h-2 rounded-full bg-electric-lime" />
            <span>SESSION: #{brand.slug.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Error / Alert Banner */}
      {errorBanner && (
        <div className="mx-8 mt-4 p-3.5 rounded-xl bg-critical-red-surface border border-critical-red/40 text-critical-red text-[13px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-critical-red hover:underline cursor-pointer text-[12px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* No Knowledge Warning Banner */}
      {knowledgeCount === 0 && (
        <div className="mx-8 mt-4 p-4 rounded-xl bg-warning-amber-surface border border-warning-amber/40 text-warning-amber text-[13px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px]">warning</span>
            <div>
              <p className="font-display font-semibold">Selected brand has no active knowledge items.</p>
              <p className="text-[12px] opacity-90">Review coverage will be limited until you add guidelines, approved facts, or prohibited terms.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToKnowledge}
            className="px-3 py-1.5 rounded-lg bg-warning-amber text-surface-obsidian font-display font-semibold text-[12px] hover:bg-white transition-colors cursor-pointer"
          >
            + Add Knowledge
          </button>
        </div>
      )}

      {/* Primary Workbench Canvas: 2-Column Split */}
      <div className="w-full px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Draft Composition & Manipulation */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-surface-graphite rounded-xl p-6 border border-border-subtle shadow-md flex flex-col gap-4">
            {/* Header with Title & Sample Draft Loader */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-lime text-[20px]">
                  edit_document
                </span>
                <span className="font-display text-[16px] text-text-mist font-semibold">
                  Draft Composition
                </span>
              </div>

              {demoFixture?.enabled && (
                <button
                  type="button"
                  onClick={handleLoadSampleDraft}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-graphite-elevated hover:bg-surface-variant transition-colors text-text-mist font-display text-[12px] border border-border-subtle cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-electric-lime">
                    history_edu
                  </span>
                  <span>Load sample draft</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-electric-lime-muted text-electric-lime font-display uppercase tracking-wider font-semibold border border-electric-lime/30">
                    Demo
                  </span>
                </button>
              )}
            </div>

            {/* Title Input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[11px] text-text-muted uppercase tracking-wider">
                Campaign or draft title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Cross-Border Product Release"
                className="w-full bg-surface-obsidian text-text-mist px-4 py-2.5 rounded-lg border border-border-subtle text-[14px] focus:outline-none focus:border-electric-lime transition-all placeholder:text-text-muted"
              />
            </div>

            {/* Plain Editor Textarea */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-text-muted">
                <label className="font-display text-[11px] uppercase tracking-wider">
                  Content Under Governance
                </label>
                <span className="font-display text-[11px] text-info-cyan">
                  Markdown Supported
                </span>
              </div>
              <textarea
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste draft copy, press releases, or promotional messaging for evaluation against active brand rules..."
                className="w-full bg-surface-obsidian text-text-mist p-4 rounded-lg border border-border-subtle text-[14px] leading-relaxed resize-none focus:outline-none focus:border-electric-lime transition-all placeholder:text-text-muted font-body"
              />
            </div>

            {/* Footer Control Strip: Counters & Check Content Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-1 font-display text-[12px]">
                  <span className="text-electric-lime font-semibold">{content.length}</span>
                  <span className="text-text-muted">/ {maxChars.toLocaleString()} characters</span>
                </div>
                <div className="w-24 h-1.5 rounded-full bg-surface-obsidian overflow-hidden border border-border-subtle">
                  <div
                    className="h-full bg-electric-lime rounded-full transition-all"
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
            <div className="p-3 rounded-lg bg-surface-obsidian border border-border-subtle flex items-start gap-3">
              <span className="material-symbols-outlined text-info-cyan text-[18px] mt-0.5 shrink-0">
                shield_lock
              </span>
              <p className="text-[12px] text-text-muted leading-relaxed">
                <strong className="text-text-mist font-semibold">Enterprise privacy protocol:</strong> Draft content is evaluated securely against the isolated {brand.name} knowledge repository. Evaluation trace is stored in your private audit ledger.
              </p>
            </div>
          </div>

          {/* Analytical Content Telemetry Cards */}
          <div className="bg-surface-graphite rounded-xl p-4 border border-border-subtle shadow-sm grid grid-cols-3 gap-3">
            <div className="bg-surface-obsidian p-3 rounded-lg border border-border-subtle flex flex-col">
              <span className="font-display text-[10px] text-text-muted uppercase tracking-wider">
                Word Count
              </span>
              <span className="font-display text-[18px] text-text-mist mt-1 font-semibold">
                {content.trim() ? content.trim().split(/\s+/).length : 0}
              </span>
              <span className="text-[11px] text-electric-lime mt-0.5">Ready for review</span>
            </div>

            <div className="bg-surface-obsidian p-3 rounded-lg border border-border-subtle flex flex-col">
              <span className="font-display text-[10px] text-text-muted uppercase tracking-wider">
                Engine Status
              </span>
              <span className="font-display text-[14px] text-text-mist mt-1 font-semibold truncate">
                {currentReview ? currentReview.engine_status.replace('_', ' ') : 'Idle'}
              </span>
              <span className="text-[11px] text-info-cyan mt-0.5">
                {currentReview ? `Version v${currentReview.version_number}.0` : 'No run yet'}
              </span>
            </div>

            <div className="bg-surface-obsidian p-3 rounded-lg border border-border-subtle flex flex-col">
              <span className="font-display text-[10px] text-text-muted uppercase tracking-wider">
                Audit Scope
              </span>
              <span className="font-display text-[14px] text-text-mist mt-1 font-semibold truncate">
                {brand.industry || 'General Brand'}
              </span>
              <span className="text-[11px] text-text-muted mt-0.5">Deterministic</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Findings & Evidence Panel */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-surface-graphite rounded-xl p-5 border border-border-subtle shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-warning-amber text-[22px]">
                  troubleshoot
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-display text-[16px] text-text-mist font-semibold">
                    {findings.length} Findings Flagged
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-surface-obsidian text-text-muted font-display uppercase border border-border-subtle">
                    {currentReview ? 'AUTO-EVAL COMPLETED' : 'AWAITING RUN'}
                  </span>
                </div>
              </div>

              {currentReview && (
                <div className="flex items-center gap-1.5 text-text-muted text-[13px]">
                  <span>Compliance Score:</span>
                  <span
                    className={`font-display text-[18px] font-bold ${
                      currentReview.summary.score >= 80
                        ? 'text-electric-lime'
                        : currentReview.summary.score >= 50
                        ? 'text-warning-amber'
                        : 'text-critical-red'
                    }`}
                  >
                    {currentReview.summary.score}/100
                  </span>
                </div>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border-subtle/50">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-lg font-display text-[12px] font-semibold transition-colors cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-surface-obsidian text-electric-lime border border-electric-lime/40'
                    : 'bg-surface-obsidian text-text-muted hover:text-text-mist border border-border-subtle'
                }`}
              >
                All ({findings.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('critical')}
                className={`px-3 py-1 rounded-lg font-display text-[12px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeFilter === 'critical'
                    ? 'bg-surface-obsidian text-critical-red border border-critical-red/40 font-semibold'
                    : 'bg-surface-obsidian text-text-muted hover:text-critical-red border border-border-subtle'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-critical-red" />
                Critical ({findings.filter((f) => f.severity === 'critical').length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('warning')}
                className={`px-3 py-1 rounded-lg font-display text-[12px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeFilter === 'warning'
                    ? 'bg-surface-obsidian text-warning-amber border border-warning-amber/40 font-semibold'
                    : 'bg-surface-obsidian text-text-muted hover:text-warning-amber border border-border-subtle'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-warning-amber" />
                Warnings ({findings.filter((f) => f.severity === 'warning').length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('terminology')}
                className={`px-3 py-1 rounded-lg font-display text-[12px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeFilter === 'terminology'
                    ? 'bg-surface-obsidian text-info-cyan border border-info-cyan/40 font-semibold'
                    : 'bg-surface-obsidian text-text-muted hover:text-info-cyan border border-border-subtle'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-info-cyan" />
                Terminology ({findings.filter((f) => f.category === 'terminology' || f.category === 'preferred_term').length})
              </button>
            </div>
          </div>

          {/* Findings List Stack */}
          <div className="flex flex-col gap-4">
            {!currentReview ? (
              <div className="p-8 rounded-xl bg-surface-graphite border border-border-subtle text-center flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-text-muted">
                  fact_check
                </span>
                <h4 className="font-display text-[15px] font-semibold text-text-mist">
                  Ready for Evaluation
                </h4>
                <p className="text-[13px] text-text-muted max-w-sm">
                  Paste your draft in the editor on the left and click &quot;Check content&quot; to inspect evidence-backed findings.
                </p>
              </div>
            ) : filteredFindings.length === 0 ? (
              <div className="p-8 rounded-xl bg-surface-graphite border border-electric-lime/30 text-center flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-electric-lime">
                  check_circle
                </span>
                <h4 className="font-display text-[15px] font-semibold text-electric-lime">
                  No issues found in configured checks
                </h4>
                <p className="text-[13px] text-text-muted max-w-sm">
                  Configured brand checks found no policy violations in this draft. Review against any additional human criteria before final approval.
                </p>
              </div>
            ) : (
              filteredFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="bg-surface-graphite rounded-xl p-5 border border-border-subtle shadow-md flex flex-col gap-3"
                >
                  {/* Card Severity & Type Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-display text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                          finding.severity === 'critical'
                            ? 'bg-critical-red-surface text-critical-red border border-critical-red/30'
                            : finding.severity === 'warning'
                            ? 'bg-warning-amber-surface text-warning-amber border border-warning-amber/30'
                            : 'bg-info-cyan-surface text-info-cyan border border-info-cyan/30'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {finding.severity === 'critical'
                            ? 'dangerous'
                            : finding.severity === 'warning'
                            ? 'warning'
                            : 'info'}
                        </span>
                        {finding.severity}
                      </span>

                      <span className="px-2 py-0.5 rounded bg-surface-obsidian text-text-muted font-display text-[11px] border border-border-subtle">
                        {finding.category.replace('_', ' ')}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-surface-obsidian text-electric-lime font-display text-[11px] border border-border-subtle">
                      {finding.source_type === 'ai' ? 'AI-assisted' : 'Deterministic check'}
                    </span>
                  </div>

                  {/* Finding Title & Explanation */}
                  <div className="flex flex-col gap-1">
                    <h4 className="font-display text-[14px] font-semibold text-text-mist">
                      {finding.title}
                    </h4>
                    <p className="text-[13px] text-text-muted leading-relaxed">
                      {finding.explanation}
                    </p>
                  </div>

                  {/* Offending Excerpt */}
                  {finding.content_excerpt && (
                    <div className="bg-surface-obsidian p-3 rounded-lg border border-border-subtle flex flex-col gap-1">
                      <span className="font-display text-[10px] text-text-muted uppercase tracking-wider">
                        Affected Text Excerpt
                      </span>
                      <div className="text-[13px] text-text-mist italic">
                        &quot;{finding.content_excerpt}&quot;
                      </div>
                    </div>
                  )}

                  {/* Approved Source Evidence Block */}
                  {finding.evidence && (
                    <div className="bg-surface-container-low p-3 rounded-lg border border-border-subtle flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-[10px] text-text-muted uppercase tracking-wider">
                          Approved Knowledge Source
                        </span>
                      </div>
                      <p className="text-[12px] text-text-mist italic">
                        {finding.evidence}
                      </p>
                    </div>
                  )}

                  {/* Suggested Rewrite with Apply Action */}
                  {finding.suggested_rewrite && (
                    <div className="bg-surface-obsidian p-3 rounded-lg border border-border-subtle flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-[11px] text-electric-lime uppercase tracking-wider font-semibold">
                          Suggested Correction
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplySuggestion(finding.content_excerpt, finding.suggested_rewrite)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded bg-electric-lime text-surface-obsidian font-display text-[11px] font-semibold hover:bg-white transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                          <span>Apply suggestion</span>
                        </button>
                      </div>
                      <p className="text-[12px] text-text-mist">
                        <span className="text-electric-lime font-medium">Replace with:</span> {finding.suggested_rewrite}
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
        <div className="w-full px-8 pt-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Human Review & Verdict Panel (8 Cols) */}
            <div className="lg:col-span-8 bg-surface-graphite rounded-xl p-6 border border-border-subtle shadow-lg flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-electric-lime-muted flex items-center justify-center border border-electric-lime/30">
                    <span className="material-symbols-outlined text-electric-lime text-[22px]">
                      gavel
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-display text-[16px] text-text-mist font-semibold">
                      Human Governance Gate
                    </h3>
                    <p className="text-[12px] text-text-muted">
                      AI and rule findings are strictly advisory; a credentialed human reviewer records the final regulatory decision.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-obsidian font-display text-[11px] text-text-muted border border-border-subtle">
                  <span className="material-symbols-outlined text-[14px] text-info-cyan">
                    verified_user
                  </span>
                  <span>Auth: Officer S. Vance (L3-Signer)</span>
                </div>
              </div>

              {/* Decision Gates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gate: Approve */}
                <button
                  type="button"
                  onClick={() => setDecisionVerdict('approved')}
                  className={`flex flex-col gap-1.5 p-4 rounded-xl text-left transition-all cursor-pointer border ${
                    decisionVerdict === 'approved'
                      ? 'bg-surface-graphite-elevated border-electric-lime shadow-[0_0_12px_rgba(198,255,77,0.2)]'
                      : 'bg-surface-obsidian border-border-subtle hover:bg-surface-graphite-elevated'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[14px] font-semibold text-electric-lime">
                      Approve
                    </span>
                    <span className="material-symbols-outlined text-electric-lime text-[20px]">
                      check_circle
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted">
                    Draft conforms to brand knowledge without critical caveats.
                  </span>
                </button>

                {/* Gate: Needs changes */}
                <button
                  type="button"
                  onClick={() => setDecisionVerdict('needs_changes')}
                  className={`flex flex-col gap-1.5 p-4 rounded-xl text-left transition-all cursor-pointer border ${
                    decisionVerdict === 'needs_changes'
                      ? 'bg-surface-graphite-elevated border-warning-amber shadow-[0_0_12px_rgba(244,185,66,0.2)]'
                      : 'bg-surface-obsidian border-border-subtle hover:bg-surface-graphite-elevated'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[14px] font-semibold text-warning-amber">
                      Needs changes
                    </span>
                    <span className="material-symbols-outlined text-warning-amber text-[20px]">
                      pending_actions
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted">
                    Violations present. Author must apply remediation items.
                  </span>
                </button>

                {/* Gate: Reject */}
                <button
                  type="button"
                  onClick={() => setDecisionVerdict('rejected')}
                  className={`flex flex-col gap-1.5 p-4 rounded-xl text-left transition-all cursor-pointer border ${
                    decisionVerdict === 'rejected'
                      ? 'bg-surface-graphite-elevated border-critical-red shadow-[0_0_12px_rgba(255,107,107,0.2)]'
                      : 'bg-surface-obsidian border-border-subtle hover:bg-surface-graphite-elevated'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[14px] font-semibold text-critical-red">
                      Reject
                    </span>
                    <span className="material-symbols-outlined text-critical-red text-[20px]">
                      cancel
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted">
                    Critical non-compliance. Draft cannot proceed through pipeline.
                  </span>
                </button>
              </div>

              {/* Reviewer Statement Textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-[11px] text-text-muted uppercase tracking-wider flex items-center justify-between">
                  <span>Statement of Record / Directive</span>
                  <span className="text-text-muted font-display text-[10px]">
                    Optional audit commentary
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  placeholder="Add reviewer remarks or specific approval conditions for audit trail documentation..."
                  className="w-full bg-surface-obsidian text-text-mist p-3 rounded-lg border border-border-subtle text-[13px] focus:outline-none focus:border-electric-lime transition-all placeholder:text-text-muted resize-none"
                />
              </div>

              {/* Record Decision Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                {decisionSuccess ? (
                  <div className="flex items-center gap-2 text-electric-lime text-[13px] font-display">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>{decisionSuccess}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-text-muted font-display text-[11px]">
                    <span className="material-symbols-outlined text-info-cyan text-[16px]">
                      schedule
                    </span>
                    <span>Active Version: v{currentReview.version_number}.0</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isRecordingDecision}
                  onClick={handleRecordDecision}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-surface-graphite-elevated hover:bg-surface-variant text-electric-lime font-display text-[13px] font-semibold border border-electric-lime/40 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isRecordingDecision ? (
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  )}
                  <span>Record decision to ledger</span>
                </button>
              </div>
            </div>

            {/* Version History Rail (4 Cols) */}
            <div className="lg:col-span-4 bg-surface-graphite rounded-xl p-6 border border-border-subtle shadow-md flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-text-muted text-[20px]">
                    history
                  </span>
                  <h3 className="font-display text-[14px] text-text-mist font-semibold">
                    Version History Rail
                  </h3>
                </div>
                <span className="font-display text-[11px] text-electric-lime">
                  Immutable Chain
                </span>
              </div>

              {/* Version History List */}
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                {versionHistory.length === 0 ? (
                  <div className="text-[12px] text-text-muted italic">
                    Single version recorded (v{currentReview.version_number}.0)
                  </div>
                ) : (
                  versionHistory.map((item) => {
                    const isCurrent = item.version_number === currentReview.version_number;
                    return (
                      <div
                        key={item.review_id}
                        className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                          isCurrent
                            ? 'bg-surface-obsidian border-electric-lime/40'
                            : 'bg-surface-container-low border-border-subtle opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-[13px] font-semibold text-text-mist">
                            v{item.version_number}.0 {isCurrent ? '(Current)' : ''}
                          </span>
                          {item.latest_decision ? (
                            <span
                              className={`px-2 py-0.5 rounded font-display text-[10px] font-semibold uppercase ${
                                item.latest_decision.decision === 'approved'
                                  ? 'bg-electric-lime-muted text-electric-lime'
                                  : item.latest_decision.decision === 'needs_changes'
                                  ? 'bg-warning-amber-surface text-warning-amber'
                                  : 'bg-critical-red-surface text-critical-red'
                              }`}
                            >
                              {item.latest_decision.decision.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-text-muted font-display">Pending</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-display text-text-muted">
                          <span>{item.finding_count} findings</span>
                          <span>•</span>
                          <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })
                )}
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
