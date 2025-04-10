'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Bible, Language, ViewMode, FontSize } from '../types/bible';

type BibleContextType = {
  tonganBible: Bible | null;
  esvBible: Bible | null;
  currentLanguage: Language;
  setCurrentLanguage: (lang: Language) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  isLoading: boolean;
};

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export function BibleProvider({ children }: { children: ReactNode }) {
  const [tonganBible, setTonganBible] = useState<Bible | null>(null);
  const [esvBible, setEsvBible] = useState<Bible | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('english');
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBibles = async () => {
      try {
        const [tonganResponse, esvResponse] = await Promise.all([
          fetch('/tongan_bible.json'),
          fetch('/esv_bible.json')
        ]);

        const [tonganData, esvData] = await Promise.all([
          tonganResponse.json(),
          esvResponse.json()
        ]);

        setTonganBible(tonganData);
        setEsvBible(esvData);
      } catch (error) {
        console.error('Error loading Bible data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBibles();
  }, []);

  return (
    <BibleContext.Provider
      value={{
        tonganBible,
        esvBible,
        currentLanguage,
        setCurrentLanguage,
        viewMode,
        setViewMode,
        fontSize,
        setFontSize,
        isLoading
      }}
    >
      {children}
    </BibleContext.Provider>
  );
}

export function useBible() {
  const context = useContext(BibleContext);
  if (context === undefined) {
    throw new Error('useBible must be used within a BibleProvider');
  }
  return context;
} 