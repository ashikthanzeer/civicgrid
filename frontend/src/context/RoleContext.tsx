import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'citizen' | 'officer';

export interface OfficerProfile {
  officer_id: string;
  name: string;
  department: string;
  token?: string;
}

interface RoleContextType {
  role: UserRole;
  isOfficer: boolean;
  officerProfile: OfficerProfile | null;
  loginAsOfficer: (officerId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutOfficer: () => void;
  changeOfficerPassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const STORAGE_KEY = 'civicgrid_role';
const PROFILE_KEY = 'civicgrid_officer_profile';

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('citizen');
  const [officerProfile, setOfficerProfile] = useState<OfficerProfile | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem(STORAGE_KEY) as UserRole | null;
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    if (savedRole === 'officer' && savedProfile) {
      try {
        setRole('officer');
        setOfficerProfile(JSON.parse(savedProfile));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PROFILE_KEY);
      }
    }
  }, []);

  const loginAsOfficer = async (officerId: string, password: string) => {
    const formattedId = officerId.trim().toUpperCase();

    // 1. Try real backend endpoint if API active
    try {
      const res = await fetch('/api/officer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id: formattedId, password }),
      });
      if (res.ok) {
        const data = await res.json();
        const profile: OfficerProfile = {
          officer_id: data.officer_id,
          name: data.name,
          department: data.department,
          token: data.token,
        };
        setRole('officer');
        setOfficerProfile(profile);
        localStorage.setItem(STORAGE_KEY, 'officer');
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        return { success: true };
      }
    } catch {
      // Backend unavailable, fall through to client mock verification
    }

    // 2. Demo credentials fallback for offline/mock mode
    const storedPw = localStorage.getItem(`pw_${formattedId}`) || 'password123';
    if ((formattedId === 'OFFICER-2026' || formattedId.startsWith('OFFICER')) && password === storedPw) {
      const profile: OfficerProfile = {
        officer_id: formattedId,
        name: 'Officer R. Sharma',
        department: 'Municipal Public Works',
        token: `token_${formattedId}`,
      };
      setRole('officer');
      setOfficerProfile(profile);
      localStorage.setItem(STORAGE_KEY, 'officer');
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      return { success: true };
    }

    return { success: false, error: 'Invalid Officer ID or Password' };
  };

  const logoutOfficer = () => {
    setRole('citizen');
    setOfficerProfile(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROFILE_KEY);
  };

  const changeOfficerPassword = async (oldPassword: string, newPassword: string) => {
    if (!officerProfile) return { success: false, error: 'Not authenticated as an officer' };

    // Update in localStorage for mock mode
    const officerId = officerProfile.officer_id;
    const storedPw = localStorage.getItem(`pw_${officerId}`) || 'password123';
    if (oldPassword !== storedPw) {
      return { success: false, error: 'Current password does not match.' };
    }

    localStorage.setItem(`pw_${officerId}`, newPassword);

    // Also call backend if active
    try {
      await fetch('/api/officer/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer_id: officerId,
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
    } catch {
      // Local fallback handled above
    }

    return { success: true, message: 'Password updated successfully!' };
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        isOfficer: role === 'officer',
        officerProfile,
        loginAsOfficer,
        logoutOfficer,
        changeOfficerPassword,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
