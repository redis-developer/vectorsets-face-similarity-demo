import { describe, it, expect } from 'vitest';
import {
  existingElementSearchInputSchema,
  newElementSearchInputSchema,
  getSampleImagesInputSchema,
} from '../src/input-schema.js';

describe('existingElementSearchInputSchema', () => {
  it('accepts valid input with all fields', () => {
    const input = {
      id: 'e123',
      count: 5,
      filterQuery: '@gender:{men}',
    };
    const result = existingElementSearchInputSchema.parse(input);
    expect(result.id).toBe('e123');
    expect(result.count).toBe(5);
    expect(result.filterQuery).toBe('@gender:{men}');
  });

  it('applies default count of 10', () => {
    const result = existingElementSearchInputSchema.parse({ id: 'e123' });
    expect(result.count).toBe(10);
  });

  it('rejects missing id', () => {
    expect(() => existingElementSearchInputSchema.parse({})).toThrow();
  });

  it('rejects count below 1', () => {
    expect(() =>
      existingElementSearchInputSchema.parse({ id: 'e1', count: 0 }),
    ).toThrow();
  });

  it('rejects count above 50', () => {
    expect(() =>
      existingElementSearchInputSchema.parse({ id: 'e1', count: 51 }),
    ).toThrow();
  });

  it('allows optional fields to be omitted', () => {
    const result = existingElementSearchInputSchema.parse({ id: 'e1' });
    expect(result.filterQuery).toBeUndefined();
  });
});

describe('newElementSearchInputSchema', () => {
  it('accepts valid input', () => {
    const input = {
      localImageUrl: '/uploads/image.jpg',
      count: 3,
    };
    const result = newElementSearchInputSchema.parse(input);
    expect(result.localImageUrl).toBe('/uploads/image.jpg');
    expect(result.count).toBe(3);
  });

  it('applies default count of 10', () => {
    const result = newElementSearchInputSchema.parse({
      localImageUrl: '/img.jpg',
    });
    expect(result.count).toBe(10);
  });

  it('rejects missing localImageUrl', () => {
    expect(() => newElementSearchInputSchema.parse({})).toThrow();
  });

  it('rejects count below 1', () => {
    expect(() =>
      newElementSearchInputSchema.parse({
        localImageUrl: '/img.jpg',
        count: 0,
      }),
    ).toThrow();
  });

  it('rejects count above 50', () => {
    expect(() =>
      newElementSearchInputSchema.parse({
        localImageUrl: '/img.jpg',
        count: 51,
      }),
    ).toThrow();
  });
});

describe('getSampleImagesInputSchema', () => {
  it('accepts empty object', () => {
    const result = getSampleImagesInputSchema.parse({});
    expect(result).toEqual({});
  });
});
