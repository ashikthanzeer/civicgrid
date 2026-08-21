import type { Complaint } from './complaint';

export interface SubmitComplaintRequest {
  text: string;
  location: string;
}

export interface SubmitComplaintResponse {
  success: boolean;
  complaint: Complaint;
}

export interface GetComplaintsResponse {
  complaints: Complaint[];
  total?: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
