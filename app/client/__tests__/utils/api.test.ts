import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/config', () => ({
  API_BASE_URL: '/api',
  IMAGE_BASE_URL: 'http://localhost:3000',
}));

vi.mock('../../src/utils/toast', () => ({
  showErrorToast: vi.fn(),
}));

import {
  apiPost,
  apiImageUpload,
  existingElementSearch,
  newElementSearch,
  getSampleImages,
  getServerConfig,
} from '../../src/utils/api';
import { showErrorToast } from '../../src/utils/toast';

describe('apiPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a POST request with JSON body and returns result', async () => {
    const mockResponse = { data: { foo: 'bar' }, error: null };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await apiPost('/test', { key: 'value' });
    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('returns error when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Bad request' }),
      }),
    );

    const result = await apiPost('/fail', {});
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
    expect(showErrorToast).toHaveBeenCalled();
  });

  it('returns error when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );

    const result = await apiPost('/error', {});
    expect(result.data).toBeNull();
    expect(result.error).toBe('Network error');
    expect(showErrorToast).toHaveBeenCalled();
  });
});

describe('apiImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-image files', async () => {
    const file = new File(['text'], 'test.txt', { type: 'text/plain' });
    const result = await apiImageUpload(file);
    expect(result.data).toBeNull();
    expect(result.error).toContain('image file');
    expect(showErrorToast).toHaveBeenCalled();
  });

  it('uploads an image file via FormData', async () => {
    const mockResponse = {
      data: { id: '123', url: '/uploads/img.jpg', filename: 'img.jpg' },
      error: null,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const file = new File(['image-data'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await apiImageUpload(file);
    expect(result).toEqual(mockResponse);

    const fetchCall = (fetch as any).mock.calls[0];
    expect(fetchCall[0]).toBe('/api/imageUpload');
    expect(fetchCall[1].method).toBe('POST');
    expect(fetchCall[1].body).toBeInstanceOf(FormData);
  });
});

describe('existingElementSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts search input and returns formatted results', async () => {
    const mockResponse = {
      data: {
        query: 'VSIM ...',
        queryResults: [
          {
            id: 'e1',
            src: '/static/faces/images/test.jpg',
            label: 'Test',
            meta: { elementId: 'e1', label: 'Test' },
          },
        ],
      },
      error: null,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await existingElementSearch({
      id: 'e1',
      count: 10,
      filterQuery: '',
    });

    expect(result.data).toBeTruthy();
    expect(result.data!.queryResults).toHaveLength(1);
    expect(result.data!.queryResults[0].src).toContain('http://localhost:3000');
  });
});

describe('getSampleImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and transforms sample images', async () => {
    const mockResponse = {
      data: [
        {
          id: 'e1',
          src: '/static/faces/img.jpg',
          meta: { elementId: 'e1', label: 'Test', charCount: 4 },
        },
      ],
      error: null,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await getSampleImages();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].src).toContain('http://localhost:3000');
  });
});

describe('newElementSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts new element search and returns results', async () => {
    const mockResponse = {
      data: {
        query: 'VSIM VALUES ...',
        queryResults: [
          { id: 'e2', src: 'http://external.com/img.jpg', label: 'Ext' },
        ],
      },
      error: null,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await newElementSearch({
      localImageUrl: '/uploads/photo.jpg',
      count: 5,
      filterQuery: '',
    });

    expect(result.data!.queryResults[0].src).toBe(
      'http://external.com/img.jpg',
    );
  });
});

describe('getServerConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches server config', async () => {
    const mockResponse = {
      data: { basePath: '' },
      error: null,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await getServerConfig();
    expect(result.data).toEqual({ basePath: '' });
  });
});
