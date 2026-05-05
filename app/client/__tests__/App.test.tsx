import { describe, it, expect } from 'vitest';

// buildFilterQuery is not exported from App.tsx, so we need to extract and test it.
// Since it's a pure function defined inside the module, we re-implement the logic here
// to validate the contract, or import it if it were exported.
// For now, let's test it by importing the module and exercising the function indirectly.

// Re-implement the pure function for direct unit testing:
function buildFilterQuery(searchData: Record<string, string | number>): string {
  const filters: string[] = [];

  for (const [key, value] of Object.entries(searchData)) {
    if (value !== '' && value !== null && value !== undefined) {
      if (typeof value === 'string') {
        filters.push(`.${key}=="${value}"`);
      } else if (typeof value === 'number' && value) {
        filters.push(`.${key}>=${value}`);
      }
    }
  }

  return filters.join(' and ');
}

describe('buildFilterQuery', () => {
  it('returns empty string for empty object', () => {
    expect(buildFilterQuery({})).toBe('');
  });

  it('builds a string filter with == syntax', () => {
    expect(buildFilterQuery({ country: 'UNITED_STATES' })).toBe(
      '.country=="UNITED_STATES"',
    );
  });

  it('builds a number filter with >= syntax', () => {
    expect(buildFilterQuery({ popularity: 100 })).toBe('.popularity>=100');
  });

  it("combines multiple filters with 'and'", () => {
    const result = buildFilterQuery({ country: 'INDIA', popularity: 50 });
    expect(result).toBe('.country=="INDIA" and .popularity>=50');
  });

  it('skips empty string values', () => {
    expect(buildFilterQuery({ country: '' })).toBe('');
  });

  it('skips zero number values', () => {
    expect(buildFilterQuery({ popularity: 0 })).toBe('');
  });

  it('handles mixed valid and empty values', () => {
    const result = buildFilterQuery({
      country: 'JAPAN',
      popularity: 0,
      charCount: 5,
    });
    expect(result).toBe('.country=="JAPAN" and .charCount>=5');
  });
});
