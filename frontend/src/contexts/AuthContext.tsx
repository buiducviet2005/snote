import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  api, ApiResponse, bootstrapSession, getSessionGeneration, getSessionSnapshot, subscribeSession
} from '../services/api';
import { UserRole } from '@snote/shared';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  timezone?: string;
  role: UserRole;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (data: { credential?: string; accessToken?: string }) => Promise<void>;
  register: (fullName: string, email: string, password: string, timezone?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { fullName?: string; timezone?: string; avatarUrl?: string | null }) => Promise<void>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState(getSessionSnapshot);
  const [user, setUser] = useState<User | null>(snapshot.session?.user ?? null);
  const [loading, setLoading] = useState(true);
  const token = snapshot.session?.accessToken ?? null;

  useEffect(() => {
    let active = true;
    const sync = () => {
      const next = getSessionSnapshot();
      setSnapshot(next);
      setUser(next.session?.user ?? null);
      setLoading(false);
    };
    const unsubscribe = subscribeSession(sync);
    if (getSessionSnapshot().session) sync();
    else {
      // StrictMode's second effect shares the same cookie refresh operation.
      bootstrapSession().catch(() => {}).finally(() => {
        if (active) setLoading(false);
      });
    }
    return () => { active = false; unsubscribe(); };
  }, []);

  const login = async (email: string, password: string) => {
    await api.post('/auth/login', { email, password });
  };

  const loginWithGoogle = async (payload: { credential?: string; accessToken?: string }) => {
    await api.post('/auth/google', payload);
  };

  const register = async (fullName: string, email: string, password: string, timezone?: string, role?: UserRole) => {
    await api.post('/auth/register', {
      fullName, email, password,
      role: role || UserRole.STUDENT,
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const logout = async () => {
    // Local state clears immediately; callers must report an unconfirmed server logout.
    await api.post('/auth/logout', {});
  };

  const refreshProfile = async () => {
    const expected = getSessionGeneration();
    try {
      const res = await api.get<ApiResponse<User>>('/auth/me');
      if (expected === getSessionGeneration() && res.data) setUser(res.data);
    } catch {
      // Refresh failure is handled centrally; stale profile failures cannot clear a newer account.
    }
  };

  const updateProfile = async (data: { fullName?: string; timezone?: string; avatarUrl?: string | null }) => {
    const expected = getSessionGeneration();
    const res = await api.put<ApiResponse<User>>('/auth/profile', data);
    if (expected === getSessionGeneration() && res.data) setUser(res.data);
  };

  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    await api.put('/auth/change-password', data);
  };

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated: Boolean(user && token),
      isAdmin: user?.role === UserRole.ADMIN, loading,
      login, loginWithGoogle, register, logout, refreshProfile, updateProfile, changePassword
    }}>
      {/* Clear account-scoped filters, loaded records and drafts at every session boundary. */}
      <React.Fragment key={snapshot.boundary}>{children}</React.Fragment>
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
