import { describe, it, expect } from 'vitest';
import { isBlocked, BLOCKED_LABELS } from '../src/blocklist.js';

describe('isBlocked', () => {
  it('returns true for a blocked label (exact case)', () => {
    expect(isBlocked('Harvey Weinstein')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(isBlocked('harvey weinstein')).toBe(true);
    expect(isBlocked('KEVIN SPACEY')).toBe(true);
    expect(isBlocked('Adolf HITLER')).toBe(true);
  });

  it('returns false for a non-blocked label', () => {
    expect(isBlocked('Tom Hanks')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isBlocked(undefined)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isBlocked('')).toBe(false);
  });

  it('BLOCKED_LABELS array is non-empty', () => {
    expect(BLOCKED_LABELS.length).toBeGreaterThan(0);
  });
});
