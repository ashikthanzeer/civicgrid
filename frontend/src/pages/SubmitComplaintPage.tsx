import React from 'react';
import { ComplaintForm } from '../components/forms/ComplaintForm';
import { SubmissionSuccess } from '../components/complaints/SubmissionSuccess';
import type { Complaint } from '../types/complaint';

const SubmitComplaintPage: React.FC = () => {
  const [submitted, setSubmitted] = React.useState<Complaint | null>(null);

  const handleReset = () => setSubmitted(null);

  return (
    <div className="mx-auto max-w-2xl">
      {submitted ? (
        <SubmissionSuccess complaint={submitted} onReset={handleReset} />
      ) : (
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Report an Issue</h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              Describe the problem in your own words. CivicGrid will structure and route your report
              to the appropriate department.
            </p>
          </div>

          <div className="surface-card p-6 sm:p-8">
            <ComplaintForm onSuccess={setSubmitted} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitComplaintPage;
