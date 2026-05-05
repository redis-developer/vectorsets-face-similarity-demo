import { describe, it, expect } from 'vitest';
import { splitQuery } from '../../src/utils/redis.js';

describe('splitQuery', () => {
  it('splits a simple command into parts', () => {
    const result = splitQuery('VSIM key ELE id');
    expect(result).toEqual(['VSIM', 'key', 'ELE', 'id']);
  });

  it('keeps quoted strings as a single token', () => {
    const result = splitQuery(
      "FT.SEARCH 'myIndex' '@brand:{nike} @gender:{men}'",
    );
    expect(result).toEqual([
      'FT.SEARCH',
      'myIndex',
      '@brand:{nike} @gender:{men}',
    ]);
  });

  it('handles double-quoted strings', () => {
    const result = splitQuery('VSIM "my key" ELE "my id"');
    expect(result).toEqual(['VSIM', 'my key', 'ELE', 'my id']);
  });

  it('strips comment lines starting with #', () => {
    const result = splitQuery('# this is a comment\nVSIM key ELE id');
    expect(result).toEqual(['VSIM', 'key', 'ELE', 'id']);
  });

  it('strips comment lines starting with //', () => {
    const result = splitQuery('// this is a comment\nVSIM key ELE id');
    expect(result).toEqual(['VSIM', 'key', 'ELE', 'id']);
  });

  it('removes empty lines', () => {
    const result = splitQuery('\n\nVSIM key\n\nELE id\n');
    expect(result).toEqual(['VSIM', 'key', 'ELE', 'id']);
  });

  it('handles escaped double quotes inside values', () => {
    const result = splitQuery('SET key \\"value\\"');
    expect(result).toEqual(['SET', 'key', '"value"']);
  });

  it('handles escaped single quotes', () => {
    const result = splitQuery("SET key \\'value\\'");
    expect(result).toEqual(['SET', 'key', "'value'"]);
  });

  it('handles escaped backslashes', () => {
    const result = splitQuery('SET key \\\\path');
    expect(result).toEqual(['SET', 'key', '\\path']);
  });

  it('handles escaped tab characters', () => {
    const result = splitQuery('SET key val\\t1');
    expect(result).toEqual(['SET', 'key', 'val\t1']);
  });

  it('handles escaped newline characters', () => {
    const result = splitQuery("SET key 'val\\nue'");
    expect(result).toEqual(['SET', 'key', 'val\nue']);
  });

  it('converts hex sequences to Buffer', () => {
    const result = splitQuery('SET key \\x48\\x49');
    expect(result[0]).toBe('SET');
    expect(result[1]).toBe('key');
    expect(Buffer.isBuffer(result[2])).toBe(true);
    expect((result[2] as Buffer).toString()).toBe('HI');
  });

  it('returns an empty array for an empty string', () => {
    const result = splitQuery('');
    expect(result).toEqual([]);
  });

  it('returns an empty array for comments-only input', () => {
    const result = splitQuery('# just a comment\n// another comment');
    expect(result).toEqual([]);
  });
});
