import type { Complaint } from '../../types/complaint';
import type { SubmitComplaintRequest, SubmitComplaintResponse, GetComplaintsResponse } from '../../types/api';
import { mockComplaints } from './complaints';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let inMemoryComplaints = [...mockComplaints];
let _nextIndex = inMemoryComplaints.length + 1;

// Realistic AI classification stubs by keywords in the complaint text
function classifyMock(text: string): Partial<Complaint> {
  const t = text.toLowerCase();
  if (t.includes('pothole') || t.includes('road') || t.includes('road')) {
    return { category: 'Roads', subcategory: 'Road pothole', severity: 'High', urgency: 'Urgent' };
  }
  if (t.includes('water') || t.includes('pipe') || t.includes('supply')) {
    return { category: 'Water', subcategory: 'Water supply issue', severity: 'High', urgency: 'Urgent' };
  }
  if (t.includes('garbage') || t.includes('waste') || t.includes('trash')) {
    return { category: 'Waste Management', subcategory: 'Missed waste collection', severity: 'Medium', urgency: 'Soon' };
  }
  if (t.includes('light') || t.includes('streetlight') || t.includes('lamp')) {
    return { category: 'Street Lighting', subcategory: 'Non-functional streetlight', severity: 'Low', urgency: 'Routine' };
  }
  if (t.includes('electric') || t.includes('power') || t.includes('outage')) {
    return { category: 'Electricity', subcategory: 'Power outage', severity: 'Medium', urgency: 'Soon' };
  }
  if (t.includes('drain') || t.includes('flood') || t.includes('waterlog')) {
    return { category: 'Drainage', subcategory: 'Road waterlogging', severity: 'Medium', urgency: 'Soon' };
  }
  if (t.includes('dog') || t.includes('stray') || t.includes('manhole') || t.includes('danger')) {
    return { category: 'Public Safety', subcategory: 'Public safety hazard', severity: 'High', urgency: 'Urgent' };
  }
  if (t.includes('hospital') || t.includes('clinic') || t.includes('doctor')) {
    return { category: 'Healthcare', subcategory: 'Healthcare facility issue', severity: 'Medium', urgency: 'Soon' };
  }
  return { category: 'Other', subcategory: 'General civic issue', severity: 'Medium', urgency: 'Routine' };
}

export const mockHandlers = {
  getComplaints: async (): Promise<GetComplaintsResponse> => {
    await delay(400);
    return { complaints: inMemoryComplaints, total: inMemoryComplaints.length };
  },

  getComplaintById: async (id: string): Promise<Complaint> => {
    await delay(200);
    const complaint = inMemoryComplaints.find(c => c.id === id);
    if (!complaint) throw new Error('Complaint not found');
    return complaint;
  },

  submitComplaint: async (req: SubmitComplaintRequest): Promise<SubmitComplaintResponse> => {
    await delay(1200); // Simulate AI classification delay
    const year = new Date().getFullYear();
    const id = `COMP-${year}-${String(_nextIndex).padStart(4, '0')}`;
    _nextIndex++;

    const classification = classifyMock(req.text);
    const now = new Date().toISOString();

    const newComplaint: Complaint = {
      id,
      raw_text: req.text,
      category: classification.category ?? 'Other',
      subcategory: classification.subcategory ?? 'General civic issue',
      severity: classification.severity ?? 'Medium',
      urgency: classification.urgency ?? 'Routine',
      location: req.location,
      affected_facility: 'Unknown',
      summary: req.text.length > 80 ? req.text.substring(0, 77) + '...' : req.text,
      created_at: now,
      updated_at: now,
      status: 'New',
    };
    inMemoryComplaints = [newComplaint, ...inMemoryComplaints];
    return { success: true, complaint: newComplaint };
  },

  updateComplaintStatus: async (id: string, status: Complaint['status']): Promise<Complaint> => {
    await delay(300);
    const index = inMemoryComplaints.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Complaint not found');
    inMemoryComplaints[index] = {
      ...inMemoryComplaints[index],
      status,
      updated_at: new Date().toISOString(),
    };
    return inMemoryComplaints[index];
  },
};
