// Aligned to backend schemas.py
export type Severity = "Low" | "Medium" | "High" | "Critical";
export type Urgency = "Routine" | "Soon" | "Urgent" | "Emergency";
export type ComplaintStatus = "New" | "Under Review" | "Assigned" | "In Progress" | "Resolved";

// Matches backend ComplaintCategory enum exactly
export type ComplaintCategory =
  | "Roads"
  | "Water"
  | "Electricity"
  | "Waste Management"
  | "Public Transport"
  | "Healthcare"
  | "Education"
  | "Street Lighting"
  | "Drainage"
  | "Public Safety"
  | "Other";

export interface Complaint {
  id: string;
  raw_text: string;
  category: string;
  subcategory: string;
  severity: Severity;
  urgency: Urgency;
  location: string;
  affected_facility: string;
  summary: string;
  created_at: string;
  updated_at: string;
  status: ComplaintStatus;
}
