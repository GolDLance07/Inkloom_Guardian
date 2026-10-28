'use client';

import React, { useState, useEffect } from 'react';
import { Brand, Review } from '@/lib/types';
import { api } from '@/lib/api';

interface ReviewHistoryViewProps {
  brand: Brand | null;
  onSelectReview: (review: Review) => void;
}

export const ReviewHistoryView: React.FC<ReviewHistoryViewProps> = ({ brand, onSelectReview }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (brand) {
      setLoading(true);
      api.getBrandReviews(brand.id)
        .then((data) => setReviews(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [brand]);

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <h3 className="font-display text-[18px] text-text-mist">Please select a brand workspace</h3>
      </div>
    );
  }

  const exportTelemetry = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reviews, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `inkloom_audit_${brand.slug}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col w-full px-8 py-6 pb-20 gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-electric-lime text-[26px]">
              history_toggle_off
            </span>
            <h2 className="font-display text-[22px] font-bold text-text-mist">
              Review History & Audit Log
            </h2>
          </div>
          <p className="text-[13px] text-text-muted">
            Immutable regulatory audit ledger and historical review versions for <strong className="text-text-mist">{brand.name}</strong>.
          </p>
        </div>

        {reviews.length > 0 && (
          <button
            type="button"
            onClick={exportTelemetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-graphite-elevated text-electric-lime font-display text-[13px] font-semibold border border-electric-lime/40 hover:bg-surface-variant transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Audit Telemetry</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-text-muted flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
          <span>Loading historical audit records...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 rounded-xl bg-surface-graphite border border-border-subtle text-center flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[36px] text-text-muted">
            receipt_long
          </span>
          <h4 className="font-display text-[16px] font-semibold text-text-mist">
            No audit records yet
          </h4>
          <p className="text-[13px] text-text-muted max-w-md">
            Reviews conducted in the workbench will appear here with complete snapshot history and human decision records.
          </p>
        </div>
      ) : (
        <div className="bg-surface-graphite rounded-xl border border-border-subtle overflow-hidden shadow-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-obsidian border-b border-border-subtle font-display text-[11px] text-text-muted uppercase tracking-wider">
                <th className="p-4">Draft Title</th>
                <th className="p-4">Version</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Findings</th>
                <th className="p-4">Engine Mode</th>
                <th className="p-4">Human Verdict</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-[13px]">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-surface-graphite-elevated/50 transition-colors">
                  <td className="p-4 font-display font-medium text-text-mist">
                    {r.title}
                  </td>
                  <td className="p-4 font-display text-electric-lime font-semibold">
                    v{r.version_number}.0
                  </td>
                  <td className="p-4 text-text-muted font-display text-[12px]">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-surface-obsidian border border-border-subtle font-display text-[11px] text-text-mist">
                      {r.summary.total} flagged
                    </span>
                  </td>
                  <td className="p-4 text-text-muted text-[12px]">
                    {r.engine_status.replace('_', ' ')}
                  </td>
                  <td className="p-4">
                    {r.latest_decision ? (
                      <span
                        className={`px-2.5 py-1 rounded-full font-display text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 ${
                          r.latest_decision.decision === 'approved'
                            ? 'bg-electric-lime-muted text-electric-lime border border-electric-lime/40'
                            : r.latest_decision.decision === 'needs_changes'
                            ? 'bg-warning-amber-surface text-warning-amber border border-warning-amber/40'
                            : 'bg-critical-red-surface text-critical-red border border-critical-red/40'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {r.latest_decision.decision === 'approved'
                            ? 'check_circle'
                            : r.latest_decision.decision === 'needs_changes'
                            ? 'pending_actions'
                            : 'cancel'}
                        </span>
                        {r.latest_decision.decision.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-text-muted text-[12px] italic">Pending</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectReview(r)}
                      className="px-3 py-1 rounded-lg bg-surface-obsidian hover:bg-surface-variant text-electric-lime font-display text-[12px] border border-border-subtle transition-colors cursor-pointer"
                    >
                      View Snapshot
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
