import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';

import { AppProvider, useAppContext } from '../../src/contexts/AppContext';

describe('useAppContext', () => {
  it('throws when used outside AppProvider', () => {
    expect(() => {
      renderHook(() => useAppContext());
    }).toThrow('useAppContext must be used within an AppProvider');
  });

  it('returns context when used inside AppProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );
    const { result } = renderHook(() => useAppContext(), { wrapper });

    expect(result.current).toHaveProperty('isSearching');
    expect(result.current).toHaveProperty('setIsSearching');
    expect(result.current).toHaveProperty('selectedImage');
    expect(result.current).toHaveProperty('setSelectedImage');
    expect(result.current).toHaveProperty('celebrityMatch');
    expect(result.current).toHaveProperty('setCelebrityMatch');
    expect(result.current).toHaveProperty('otherMatches');
    expect(result.current).toHaveProperty('setOtherMatches');
    expect(result.current).toHaveProperty('searchFormData');
    expect(result.current).toHaveProperty('setSearchFormData');
    expect(result.current).toHaveProperty('lastQuery');
    expect(result.current).toHaveProperty('setLastQuery');
  });

  it('has correct initial values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );
    const { result } = renderHook(() => useAppContext(), { wrapper });

    expect(result.current.isSearching).toBe(false);
    expect(result.current.selectedImage).toBeNull();
    expect(result.current.celebrityMatch).toBeNull();
    expect(result.current.otherMatches).toEqual([]);
    expect(result.current.searchFormData).toEqual({});
    expect(result.current.lastQuery).toBe('');
  });
});
