import type { Severity, Urgency, ComplaintStatus, ComplaintCategory } from '../types/complaint';

// Matches backend ComplaintCategory enum
export const CATEGORIES: ComplaintCategory[] = [
  "Roads",
  "Water",
  "Electricity",
  "Waste Management",
  "Public Transport",
  "Healthcare",
  "Education",
  "Street Lighting",
  "Drainage",
  "Public Safety",
  "Other",
];

export const WARDS: string[] = Array.from({ length: 15 }, (_, i) => `Ward ${i + 1}`);

export const SEVERITY_LEVELS: Severity[] = ["Low", "Medium", "High", "Critical"];
export const URGENCY_LEVELS: Urgency[] = ["Routine", "Soon", "Urgent", "Emergency"];
export const STATUS_OPTIONS: ComplaintStatus[] = ["New", "Under Review", "Assigned", "In Progress", "Resolved"];
