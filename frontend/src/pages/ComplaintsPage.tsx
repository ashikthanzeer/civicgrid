import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Select } from 'antd';
import { useComplaints } from '../hooks/useComplaints';
import { ComplaintTable } from '../components/complaints/ComplaintTable';
import { ComplaintCard } from '../components/complaints/ComplaintCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { CATEGORIES, SEVERITY_LEVELS, URGENCY_LEVELS, WARDS } from '../utils/constants';
import type { Complaint, Severity, Urgency } from '../types/complaint';
import type { ExplorerSort } from '../types/filters';

const SEVERITY_RANK: Record<Severity, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };
const URGENCY_RANK: Record<Urgency, number> = { Routine: 1, Soon: 2, Urgent: 3, Emergency: 4 };

function applySort(list: Complaint[], sort: ExplorerSort): Complaint[] {
  return [...list].sort((a, b) => {
    switch (sort) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'highest_severity':
        return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      case 'highest_urgency':
        return URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency];
    }
  });
}

const ComplaintsPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useComplaints();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string[]>([]);
  const [severity, setSeverity] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<string[]>([]);
  const [location, setLocation] = useState<string[]>([]);
  const [sort, setSort] = useState<ExplorerSort>('newest');

  const filtered = useMemo(() => {
    let list = data?.complaints ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.summary.toLowerCase().includes(q) || c.raw_text.toLowerCase().includes(q),
      );
    }
    if (category.length) list = list.filter((c) => category.includes(c.category));
    if (severity.length) list = list.filter((c) => severity.includes(c.severity));
    if (urgency.length) list = list.filter((c) => urgency.includes(c.urgency));
    if (location.length) list = list.filter((c) => location.includes(c.location));
    return applySort(list, sort);
  }, [data, search, category, severity, urgency, location, sort]);

  const hasFilters = search || category.length || severity.length || urgency.length || location.length;
  const clearAll = () => {
    setSearch('');
    setCategory([]);
    setSeverity([]);
    setUrgency([]);
    setLocation([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Complaints</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
          Search and explore citizen-reported civic issues.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4" style={{ color: 'var(--color-muted)' }} />
            </div>
            <input
              type="search"
              placeholder="Search by keyword or summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search complaints"
              className="field-input pl-11"
            />
          </div>

          <Select
            value={sort}
            onChange={(v) => setSort(v as ExplorerSort)}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'highest_severity', label: 'Highest Severity' },
              { value: 'highest_urgency', label: 'Highest Urgency' },
            ]}
            size="large"
            className="w-full sm:w-56"
            aria-label="Sort complaints"
            suffixIcon={<SlidersHorizontal className="h-4 w-4" style={{ color: 'var(--color-muted)' }} />}
          />
        </div>

        <div
          className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border p-4"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
            Filters
          </span>
          <Select
            mode="multiple"
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            placeholder="Category"
            className="min-w-[140px]"
            maxTagCount={1}
            aria-label="Filter by category"
          />
          <Select
            mode="multiple"
            value={severity}
            onChange={setSeverity}
            options={SEVERITY_LEVELS.map((s) => ({ value: s, label: s }))}
            placeholder="Severity"
            className="min-w-[140px]"
            maxTagCount={1}
            aria-label="Filter by severity"
          />
          <Select
            mode="multiple"
            value={urgency}
            onChange={setUrgency}
            options={URGENCY_LEVELS.map((u) => ({ value: u, label: u }))}
            placeholder="Urgency"
            className="min-w-[140px]"
            maxTagCount={1}
            aria-label="Filter by urgency"
          />
          <Select
            mode="multiple"
            value={location}
            onChange={setLocation}
            options={WARDS.map((w) => ({ value: w, label: w }))}
            placeholder="Location"
            className="min-w-[140px]"
            maxTagCount={1}
            aria-label="Filter by location"
          />
          {hasFilters && (
            <button type="button" onClick={clearAll} className="btn-secondary ml-auto !px-3 !py-1.5 text-xs">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {!isLoading && !isError && (
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Showing {filtered.length} of {data?.complaints.length ?? 0} complaints
        </p>
      )}

      {isError ? (
        <ErrorState message="We couldn't load the complaints." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <LoadingSkeleton key={i} variant="row" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No complaints match your filters"
          description="Try adjusting your search or clearing the active filters."
          action={hasFilters ? { label: 'Clear Filters', onClick: clearAll } : undefined}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <ComplaintTable complaints={filtered} loading={isLoading} />
          </div>
          <div className="space-y-3 md:hidden">
            {filtered.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ComplaintsPage;
