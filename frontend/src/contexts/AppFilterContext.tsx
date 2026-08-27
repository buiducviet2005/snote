import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../services/api';
import { useAuth } from './AuthContext';

export interface SemesterOption {
  id: string;
  name: string;
  academicYear: string;
  isCurrent: boolean;
}

export interface SubjectOption {
  id: string;
  semesterId: string;
  name: string;
  code: string | null;
  credits: number;
  color: string | null;
  lecturer: string | null;
}

interface AppFilterContextType {
  selectedSemesterId: string | null;
  selectedSubjectId: string | null;
  setSelectedSemesterId: (id: string | null) => void;
  setSelectedSubjectId: (id: string | null) => void;
  semesters: SemesterOption[];
  subjects: SubjectOption[];
  currentSemester: SemesterOption | null;
  loadingFilter: boolean;
  refreshFilterData: () => Promise<void>;
}

const AppFilterContext = createContext<AppFilterContextType | undefined>(undefined);

export const AppFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loadingFilter, setLoadingFilter] = useState<boolean>(false);

  const fetchFilterData = useCallback(async () => {
    if (!isAuthenticated) {
      setSemesters([]);
      setSubjects([]);
      setSelectedSemesterId(null);
      setSelectedSubjectId(null);
      return;
    }

    setLoadingFilter(true);
    try {
      const [semRes, subRes] = await Promise.all([
        api.get<ApiResponse<SemesterOption[]>>('/semesters'),
        api.get<ApiResponse<SubjectOption[]>>('/subjects')
      ]);

      const sems = semRes.data || [];
      const subs = subRes.data || [];
      setSemesters(sems);
      setSubjects(subs);

      // Auto-select current semester
      const cur = sems.find((s) => s.isCurrent);
      if (cur && !selectedSemesterId) {
        setSelectedSemesterId(cur.id);
      } else if (sems.length > 0 && !selectedSemesterId) {
        setSelectedSemesterId(sems[0].id);
      }
    } catch {
      // Ignore filter error on initial load
    } finally {
      setLoadingFilter(false);
    }
  }, [isAuthenticated, selectedSemesterId]);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  // Khi đổi semester -> reset subject nếu subject đó không thuộc semester mới
  const handleSetSemester = (id: string | null) => {
    setSelectedSemesterId(id);
    if (id) {
      const subInSem = subjects.filter((s) => s.semesterId === id);
      if (selectedSubjectId && !subInSem.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(null);
      }
    }
  };

  const currentSemester = semesters.find((s) => s.id === selectedSemesterId) || null;

  return (
    <AppFilterContext.Provider
      value={{
        selectedSemesterId,
        selectedSubjectId,
        setSelectedSemesterId: handleSetSemester,
        setSelectedSubjectId,
        semesters,
        subjects,
        currentSemester,
        loadingFilter,
        refreshFilterData: fetchFilterData
      }}
    >
      {children}
    </AppFilterContext.Provider>
  );
};

export function useAppFilter(): AppFilterContextType {
  const context = useContext(AppFilterContext);
  if (!context) {
    throw new Error('useAppFilter must be used within an AppFilterProvider');
  }
  return context;
}
