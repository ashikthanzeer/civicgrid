import React from 'react';
import { FileText, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { KpiCard } from './KpiCard';
import type { Complaint } from '../../types/complaint';

interface DashboardKpisProps {
  complaints: Complaint[];
  loading?: boolean;
}

export const DashboardKpis: React.FC<DashboardKpisProps> = ({ complaints, loading }) => {
  const total = complaints.length;
  const urgent = complaints.filter((c) => c.urgency === 'Urgent' || c.urgency === 'Emergency').length;
  const critical = complaints.filter((c) => c.severity === 'Critical').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="surface-card p-6">
      <h2 className="mb-6 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
        Key metrics
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total reports"
          value={total}
          icon={FileText}
          maxValue={Math.max(total * 1.5, 100)}
          trend={{ value: 12, label: 'this week' }}
          accentColor="var(--color-primary)"
          loading={loading}
        />
        <KpiCard
          title="Urgent"
          value={urgent}
          icon={AlertTriangle}
          maxValue={total || 1}
          trend={{ value: 8, label: 'this week' }}
          accentColor="var(--color-warning)"
          loading={loading}
        />
        <KpiCard
          title="Critical"
          value={critical}
          icon={Zap}
          maxValue={total || 1}
          trend={{ value: -3, label: 'this week' }}
          accentColor="var(--color-danger)"
          loading={loading}
        />
        <KpiCard
          title="Resolved"
          value={resolved}
          icon={CheckCircle2}
          maxValue={total || 1}
          trend={{ value: 18, label: 'this week' }}
          accentColor="var(--color-success)"
          loading={loading}
        />
      </div>
    </div>
  );
};
