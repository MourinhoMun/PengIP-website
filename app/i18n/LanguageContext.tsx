'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { translations, Language, Translations } from './translations';

interface LanguageContextType {
  lang: Language;
  t: Translations;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('zh');

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'zh' ? 'en' : 'zh'));
  };

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
  };

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
