import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { translationsVi } from '../locales/vi';
import { translationsEn } from '../locales/en';

export type Language = 'vi' | 'en';

export interface Translations {
  [key: string]: string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'snote_locale_lang';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'vi' || saved === 'en') return saved;
      // Default to Vietnamese for the primary student environment
      return 'vi';
    } catch {
      return 'vi';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Ignore local storage error
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const dict = useMemo(() => {
    return language === 'en' ? translationsEn : translationsVi;
  }, [language]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let str = dict[key] || translationsVi[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  }, [dict]);

  const formatDate = useCallback((date: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      const locale = language === 'vi' ? 'vi-VN' : 'en-US';
      return d.toLocaleDateString(locale, options || { year: 'numeric', month: 'numeric', day: 'numeric' });
    } catch {
      return '';
    }
  }, [language]);

  const formatTime = useCallback((date: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      const locale = language === 'vi' ? 'vi-VN' : 'en-US';
      return d.toLocaleTimeString(locale, options || { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [language]);

  const formatDateTime = useCallback((date: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      const locale = language === 'vi' ? 'vi-VN' : 'en-US';
      return d.toLocaleString(locale, options || {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, formatDate, formatTime, formatDateTime }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
