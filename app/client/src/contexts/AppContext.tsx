'use client';
import type { ImageDoc, SearchFormData } from '../types';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

const AppContext = createContext<{
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  selectedImage: ImageDoc | null;
  setSelectedImage: (image: ImageDoc | null) => void;
  celebrityMatch: ImageDoc | null;
  setCelebrityMatch: (match: ImageDoc | null) => void;
  otherMatches: ImageDoc[];
  setOtherMatches: (matches: ImageDoc[]) => void;
  searchFormData: SearchFormData;
  setSearchFormData: (data: SearchFormData) => void;
  lastQuery: string;
  setLastQuery: (query: string) => void;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageDoc | null>(null);
  const [celebrityMatch, setCelebrityMatch] = useState<ImageDoc | null>(null);
  const [otherMatches, setOtherMatches] = useState<ImageDoc[]>([]);
  const [searchFormData, setSearchFormData] = useState<SearchFormData>({});
  const [lastQuery, setLastQuery] = useState<string>('');

  return (
    <AppContext.Provider
      value={{
        isSearching,
        setIsSearching,
        selectedImage,
        setSelectedImage,
        celebrityMatch,
        setCelebrityMatch,
        otherMatches,
        setOtherMatches,
        searchFormData,
        setSearchFormData,
        lastQuery,
        setLastQuery,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
