import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mic, Cpu, BarChart3, CheckCircle2, MapPin, AlertTriangle, Zap, Trash2, Droplets } from 'lucide-react';

const STEPS = [
  {
    icon: Mic,
    label: 'Step 1',
    title: 'Citizens speak freely',
    description: 'Report issues in your own words — any language, any length. No forms, no jargon.',
    color: 'var(--color-primary)',
  },
  {
    icon: Cpu,
    label: 'Step 2',
    title: 'AI understands instantly',
    description: 'CivicGrid structures each report into category, priority, location, and urgency.',
    color: 'var(--color-accent)',
  },
  {
    icon: BarChart3,
    label: 'Step 3',
    title: 'Teams see what matters',
    description: 'Critical issues surface first. Patterns across wards reveal systemic problems.',
    color: 'var(--color-success)',
  },
  {
    icon: CheckCircle2,
    label: 'Step 4',
    title: 'Complaints get resolved',
    description: 'Structured data routes to the right department. Citizens track progress in real time.',
    color: 'var(--color-primary)',
  },
] as const;

const EXAMPLE_COMPLAINT = {
  raw: 'The streetlight near our house has been broken for two weeks and nobody has fixed it. It is very dark at night and feels unsafe for women walking home.',
  result: {
    category: 'Street Lighting',
    subcategory: 'Non-functional streetlight',
    severity: 'Medium',
    urgency: 'Soon',
    location: 'Unknown',
    summary: 'Streetlight broken for two weeks, creating safety concern for pedestrians.',
  },
};

const ISSUE_EXAMPLES = [
  { icon: AlertTriangle, label: 'Potholes & Roads', color: '#e8a54b' },
  { icon: Droplets, label: 'Water & Drainage', color: '#4a8fd4' },
  { icon: Zap, label: 'Power Outages', color: '#f79009' },
  { icon: Trash2, label: 'Waste & Sanitation', color: '#52b788' },
];

const LandingPage: React.FC = () => {
  return (
    <div className="space-y-14 sm:space-y-20 lg:space-y-24 pb-12 sm:pb-16">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-3xl pt-4 sm:pt-8 text-center lg:pt-12 px-1">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
            color: 'var(--color-primary)',
            border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
          </span>
          AI-powered civic intelligence
        </div>

        <h1
          className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
          style={{ lineHeight: 1.12 }}
        >
          Every complaint,{' '}
          <span style={{ color: 'var(--color-primary)' }}>understood</span>.
        </h1>

        <p
          className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg lg:text-xl leading-relaxed"
          style={{ color: 'var(--color-muted)' }}
        >
          CivicGrid turns unstructured citizen complaints into structured, prioritised, actionable civic intelligence — instantly.
        </p>

        <div className="mt-8 sm:mt-10 flex flex-col items-stretch sm:items-center justify-center gap-3 sm:flex-row">
          <Link to="/submit" className="btn-primary w-full sm:w-auto">
            Report an Issue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/dashboard"
            className="btn-secondary w-full sm:w-auto"
          >
            View Dashboard
          </Link>
        </div>

        {/* Issue type pills */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {ISSUE_EXAMPLES.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color }} />
              {label}
            </div>
          ))}
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-muted)',
            }}
          >
            + more categories
          </div>
        </div>
      </section>

      {/* ── Live Example ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            See CivicGrid in action
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
            A citizen complaint is instantly transformed into structured data.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Raw complaint */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <div
                className="rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-muted) 12%, transparent)',
                  color: 'var(--color-muted)',
                }}
              >
                Citizen report
              </div>
            </div>
            <p className="text-base italic leading-relaxed" style={{ color: 'var(--color-text)' }}>
              "{EXAMPLE_COMPLAINT.raw}"
            </p>
          </div>

          {/* Structured result */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid color-mix(in srgb, var(--color-primary) 35%, transparent)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <div
                className="rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                  color: 'var(--color-primary)',
                }}
              >
                CivicGrid output
              </div>
            </div>
            <dl className="space-y-3">
              {Object.entries(EXAMPLE_COMPLAINT.result).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-4">
                  <dt
                    className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-muted)', paddingTop: '2px' }}
                  >
                    {key.replace(/_/g, ' ')}
                  </dt>
                  <dd
                    className="text-right text-sm font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            How CivicGrid works
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Four steps from report to resolution.
          </p>
        </div>

        <ol className="relative grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="relative flex flex-col p-6"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
                >
                  <Icon className="h-5 w-5" style={{ color: step.color }} aria-hidden />
                </div>
                <span
                  className="mb-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {step.label}
                </span>
                <h3 className="font-display text-base font-bold" style={{ color: 'var(--color-text)' }}>
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  {step.description}
                </p>
                {index < STEPS.length - 1 && (
                  <div
                    className="absolute -right-px top-1/2 hidden h-px w-px lg:block"
                    style={{ color: 'var(--color-border)' }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── CTA strip ─────────────────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-8 text-center sm:p-12"
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)), var(--color-surface))',
          border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
        }}
      >
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <MapPin className="h-6 w-6" style={{ color: 'var(--color-primary-fg)' }} aria-hidden />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: 'var(--color-text)' }}>
          See something that needs fixing?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Describe it in plain language. CivicGrid handles the rest — classification, routing, and tracking — so the right team can act.
        </p>
        <Link to="/submit" className="btn-primary mt-8 inline-flex">
          Report an Issue
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;
