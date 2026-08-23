// Aligned to backend schemas.py
export type Severity = "Low" | "Medium" | "High" | "Critical";
export type Urgency = "Routine" | "Soon" | "Urgent" | "Emergency";
export type ComplaintStatus = "New" | "Under Review" | "Assigned" | "In Progress" | "Resolved" | "Rejected / Spam";

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
  | "Spam / Invalid"
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
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  image_analysis?: string | null;
  is_duplicate?: boolean;
  duplicate_of_id?: string | null;
  citizen_reports_count?: number;
  additional_updates?: string | Array<{ text: string; created_at: string; image_url?: string }>;
  detected_language?: string;
}
