import React from 'react';
import { CheckCircle2, LayoutDashboard, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Complaint } from '../../types/complaint';
import { SeverityBadge } from '../ui/SeverityBadge';
import { UrgencyBadge } from '../ui/UrgencyBadge';
import { CategoryBadge } from '../ui/CategoryBadge';

interface SubmissionSuccessProps {
  complaint: Complaint;
  onReset: () => void;
}

export const SubmissionSuccess: React.FC<SubmissionSuccessProps> = ({ complaint, onReset }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-[var(--radius)] border"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-success) 40%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
          }}
        >
          <CheckCircle2 className="h-8 w-8" style={{ color: 'var(--color-success)' }} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
            Report submitted
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--color-muted)' }}>
            Your report has been processed and routed to the relevant department.
          </p>
        </div>
      </div>

      <div className="surface-card p-6 text-left">
        <div
          className="mb-6 flex flex-wrap items-center gap-2 border-b pb-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Issue details
          </h3>
          <span
            className="ml-auto rounded-[var(--radius)] border px-2 py-1 text-xs font-medium"
            style={{
              color: 'var(--color-primary)',
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)',
            }}
          >
            ID: {complaint.id.split('-')[0]}
          </span>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <CategoryBadge category={complaint.category} />
          <SeverityBadge severity={complaint.severity} />
          <UrgencyBadge urgency={complaint.urgency} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Category
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {complaint.category}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Subcategory
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {complaint.subcategory}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Location
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>
              {complaint.location}
            </p>
          </div>
          {complaint.affected_facility && (
            <div className="col-span-2 sm:col-span-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Affected facility
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                {complaint.affected_facility}
              </p>
            </div>
          )}
        </div>

        {complaint.summary && (
          <div
            className="mt-6 rounded-[var(--radius)] border p-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Summary
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
              {complaint.summary}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => navigate('/dashboard')} className="btn-primary flex-1">
          <LayoutDashboard className="h-4 w-4" />
          Go to Dashboard
        </button>
        <button type="button" onClick={onReset} className="btn-secondary flex-1">
          <RotateCcw className="h-4 w-4" />
          Report Another Issue
        </button>
      </div>
    </div>
  );
};
