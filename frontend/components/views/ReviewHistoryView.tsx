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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-ink-wash">
        <h3 className="font-editorial text-[20px] font-bold text-[#0B132B]">Please select a brand workspace</h3>
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
    <div className="flex flex-col w-full px-8 py-6 pb-20 gap-6 bg-ink-wash min-h-screen text-[#18181B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DEC8]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-crimson text-[26px]">
              history_toggle_off
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#0B132B]">
              Review History &amp; Audit Log
            </h2>
          </div>
          <p className="text-xs text-[#64748B]">
            Immutable regulatory audit ledger and historical review versions for <strong className="text-[#0B132B]">{brand.name}</strong>.
          </p>
        </div>

        {reviews.length > 0 && (
          <button
            type="button"
            onClick={exportTelemetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#0B132B] font-sans text-xs font-semibold border border-[#E0D7C3] hover:border-slate-400 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">ios_share</span>
            <span>Export Audit Telemetry</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#64748B] flex items-center justify-center gap-2 font-mono text-xs">
          <span className="material-symbols-outlined text-[20px] animate-spin text-crimson">progress_activity</span>
          <span>Loading historical audit records...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 rounded-xl bg-white border border-[#E5DDCB] sumi-card-shadow text-center flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[36px] text-gray-400">
            receipt_long
          </span>
          <h4 className="font-serif text-lg font-bold text-[#0B132B]">
            No audit records yet
          </h4>
          <p className="text-xs text-[#64748B] max-w-md">
            Reviews conducted in the workbench will appear here with complete snapshot history and human decision records.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5DDCB] sumi-card-shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F2] border-b border-[#EDE5D5] font-mono text-[10px] text-[#64748B] uppercase tracking-wider">
                <th className="p-4">Draft Title</th>
                <th className="p-4">Version</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Findings</th>
                <th className="p-4">Engine Mode</th>
                <th className="p-4">Human Verdict</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE0] text-[13px]">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                  <td className="p-4 font-serif font-bold text-[#0B132B]">
                    {r.title}
                  </td>
                  <td className="p-4 font-mono text-crimson font-bold">
                    v{r.version_number}.0
                  </td>
                  <td className="p-4 text-slate-500 font-mono text-[12px]">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-[#F8F5EE] border border-[#E5DDCB] font-mono text-[11px] text-[#0B132B] font-medium">
                      {r.summary.total} flagged
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 text-[12px] font-mono">
                    {r.engine_status.replace('_', ' ')}
                  </td>
                  <td className="p-4">
                    {r.latest_decision ? (
                      <span
                        className={`px-2.5 py-1 rounded-full font-sans text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          r.latest_decision.decision === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.latest_decision.decision === 'needs_changes'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-crimson border border-red-200'
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
                      <span className="text-slate-400 text-[12px] italic">Pending</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectReview(r)}
                      className="px-3 py-1 rounded-lg bg-[#0B132B] hover:bg-[#15203D] text-white font-sans text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
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
