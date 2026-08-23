import { apiClient, isMockMode } from './client';
import { mockHandlers } from './mock/handlers';
import type { Complaint } from '../types/complaint';
import type { SubmitComplaintRequest, SubmitComplaintResponse, GetComplaintsResponse } from '../types/api';

// No URLSearchParams param — React Query passes QueryFunctionContext, not params.
// Filtering happens on the frontend in the pages that use this hook.
export const getComplaints = async (): Promise<GetComplaintsResponse> => {
  if (isMockMode) return mockHandlers.getComplaints();
  return apiClient<GetComplaintsResponse>('/api/complaints');
};

export const getComplaintById = async (id: string): Promise<Complaint> => {
  if (isMockMode) return mockHandlers.getComplaintById(id);
  return apiClient<Complaint>(`/api/complaints/${id}`);
};

export const submitComplaint = async (data: SubmitComplaintRequest): Promise<SubmitComplaintResponse> => {
  if (isMockMode) return mockHandlers.submitComplaint(data);
  return apiClient<SubmitComplaintResponse>('/api/complaints', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateComplaintStatus = async (id: string, status: Complaint['status']): Promise<Complaint> => {
  if (isMockMode) return mockHandlers.updateComplaintStatus(id, status);
  return apiClient<Complaint>(`/api/complaints/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const deleteComplaint = async (id: string): Promise<{ success: boolean; message: string }> => {
  if (isMockMode) return mockHandlers.deleteComplaint(id);
  return apiClient<{ success: boolean; message: string }>(`/api/complaints/${id}`, {
    method: 'DELETE',
  });
};

export interface StatsResponse {
  total: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
}

export const getStats = async (): Promise<StatsResponse> => {
  if (isMockMode) {
    const { complaints } = await mockHandlers.getComplaints();
    const valid = complaints.filter((c) => c.status !== 'Rejected / Spam' && c.category !== 'Spam / Invalid');
    const by_status: Record<string, number> = {};
    const by_category: Record<string, number> = {};
    const by_severity: Record<string, number> = {};
    for (const c of valid) {
      by_status[c.status] = (by_status[c.status] ?? 0) + 1;
      by_category[c.category] = (by_category[c.category] ?? 0) + 1;
      by_severity[c.severity] = (by_severity[c.severity] ?? 0) + 1;
    }
    return { total: valid.length, by_status, by_category, by_severity };
  }
  return apiClient<StatsResponse>('/api/complaints/stats');
};

export interface TranslateResponse {
  original_text: string;
  translated_text: string;
  target_language: string;
  detected_language?: string;
}

export const translateComplaintText = async (
  text: string,
  targetLanguage: string,
  sourceLanguage?: string,
): Promise<{ translatedText: string; detectedLanguage?: string }> => {
  if (!text || text.trim() === '') {
    return { translatedText: '' };
  }
  if (isMockMode) {
    return { translatedText: text, detectedLanguage: sourceLanguage || 'English' };
  }
  try {
    const res = await apiClient<TranslateResponse>('/api/translate', {
      method: 'POST',
      body: JSON.stringify({
        text,
        target_language: targetLanguage,
        source_language: sourceLanguage,
      }),
    });
    return {
      translatedText: res.translated_text || text,
      detectedLanguage: res.detected_language || sourceLanguage,
    };
  } catch (err) {
    console.warn('Translation API failed, using original text:', err);
    return { translatedText: text, detectedLanguage: sourceLanguage };
  }
};


