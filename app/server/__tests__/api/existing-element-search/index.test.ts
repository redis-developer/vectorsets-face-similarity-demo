import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/utils/redis.js', () => ({
  RedisWrapperST: {
    getInstance: vi.fn(),
  },
  splitQuery: vi.fn(),
}));

vi.mock('../../../src/config.js', () => ({
  getConfig: vi.fn(() => ({
    BASE_PATH: '',
    DATASET: {
      IMAGE_PREFIX: '/static/faces/',
      VECTOR_SET: { KEY: 'vset:faces', DIM: 3072 },
    },
  })),
}));

import { existingElementSearch } from '../../../src/api/existing-element-search/index.js';
import { RedisWrapperST } from '../../../src/utils/redis.js';

describe('existingElementSearch', () => {
  it('builds a VSIM ELE query and returns formatted results', async () => {
    const mockRawCommandExecute = vi
      .fn()
      .mockResolvedValue([
        'e100',
        '1.0000',
        '{"label":"Person A","imagePath":"images/100.jpg"}',
        'e200',
        '0.9500',
        '{"label":"Person B","imagePath":"images/200.jpg"}',
      ]);

    vi.mocked(RedisWrapperST.getInstance).mockReturnValue({
      rawCommandExecute: mockRawCommandExecute,
    } as any);

    const result = await existingElementSearch({ id: 'e100', count: 10 });

    expect(mockRawCommandExecute).toHaveBeenCalledOnce();
    const query = mockRawCommandExecute.mock.calls[0][0] as string;
    expect(query).toContain('VSIM');
    expect(query).toContain('ELE');
    expect(query).toContain('e100');
    expect(query).toContain('WITHSCORES');
    expect(query).toContain('WITHATTRIBS');
    expect(query).toContain('COUNT 10');

    expect(result.queryResults.every((r) => r.id !== 'e100')).toBe(true);
    expect(result.queryResults).toHaveLength(1);
    expect(result.queryResults[0].id).toBe('e200');
  });

  it('includes FILTER clause when filterQuery is provided', async () => {
    const mockRawCommandExecute = vi.fn().mockResolvedValue([]);
    vi.mocked(RedisWrapperST.getInstance).mockReturnValue({
      rawCommandExecute: mockRawCommandExecute,
    } as any);

    await existingElementSearch({
      id: 'e1',
      count: 5,
      filterQuery: '@gender:{men}',
    });

    const query = mockRawCommandExecute.mock.calls[0][0] as string;
    expect(query).toContain('FILTER');
    expect(query).toContain('@gender:{men}');
  });

  it('throws on invalid input', async () => {
    await expect(existingElementSearch({} as any)).rejects.toThrow();
  });
});
