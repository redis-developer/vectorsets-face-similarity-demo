import { describe, it, expect } from 'vitest';
import {
  convertVectorSetSearchResultsToObjectArr,
  formatImageResults,
} from '../../../src/api/common/index.js';

describe('convertVectorSetSearchResultsToObjectArr', () => {
  it('converts a well-formed results array into objects', () => {
    const results = [
      'e12403',
      '1',
      '{"label":"Megan Rapinoe","imagePath":"images/12402_Megan_Rapinoe.jpg","charCount":13}',
      'e12412',
      '0.9574365168809891',
      '{"label":"Megan Rapinoe","imagePath":"images/12411_Megan_Rapinoe.jpg","charCount":13}',
    ];
    const output = convertVectorSetSearchResultsToObjectArr(results);
    expect(output).toHaveLength(2);
    expect(output[0]).toEqual({
      elementId: 'e12403',
      score: '1.0000',
      label: 'Megan Rapinoe',
      imagePath: 'images/12402_Megan_Rapinoe.jpg',
      charCount: 13,
    });
    expect(output[1].score).toBe('0.9574');
  });

  it('returns an empty array for undefined input', () => {
    expect(convertVectorSetSearchResultsToObjectArr(undefined)).toEqual([]);
  });

  it('returns an empty array for empty input', () => {
    expect(convertVectorSetSearchResultsToObjectArr([])).toEqual([]);
  });

  it('handles a single result triplet', () => {
    const results = ['e1', '0.5', '{"label":"Test"}'];
    const output = convertVectorSetSearchResultsToObjectArr(results);
    expect(output).toHaveLength(1);
    expect(output[0].elementId).toBe('e1');
    expect(output[0].label).toBe('Test');
  });
});

describe('formatImageResults', () => {
  it('maps results to ImageDoc format with prefix', () => {
    const results = [
      {
        elementId: 'e1',
        imagePath: 'images/test.jpg',
        label: 'Test',
        score: '0.95',
      },
    ];
    const output = formatImageResults(results, '/static/faces/');
    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({
      id: 'e1',
      src: '/static/faces/images/test.jpg',
      label: 'Test',
      score: '0.95',
      meta: results[0],
    });
  });

  it('returns an empty array for empty results', () => {
    expect(formatImageResults([], '/prefix/')).toEqual([]);
  });

  it('handles results without optional fields', () => {
    const results = [{ elementId: 'e2', imagePath: 'img.png' }];
    const output = formatImageResults(results, '/p/');
    expect(output[0].id).toBe('e2');
    expect(output[0].src).toBe('/p/img.png');
    expect(output[0].label).toBeUndefined();
  });

  it('filters out blocked labels', () => {
    const results = [
      { elementId: 'e1', imagePath: 'a.jpg', label: 'Harvey Weinstein' },
      { elementId: 'e2', imagePath: 'b.jpg', label: 'Tom Hanks' },
      { elementId: 'e3', imagePath: 'c.jpg', label: 'Kevin Spacey' },
    ];
    const output = formatImageResults(results, '/static/faces/');
    expect(output).toHaveLength(1);
    expect(output[0].label).toBe('Tom Hanks');
  });

  it('filters blocked labels case-insensitively', () => {
    const results = [
      { elementId: 'e1', imagePath: 'a.jpg', label: 'harvey weinstein' },
    ];
    const output = formatImageResults(results, '/prefix/');
    expect(output).toHaveLength(0);
  });

  it('does not filter results with no label', () => {
    const results = [{ elementId: 'e1', imagePath: 'a.jpg' }];
    const output = formatImageResults(results, '/prefix/');
    expect(output).toHaveLength(1);
  });
});
