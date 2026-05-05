import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExistingElementSearch = vi.fn();
const mockNewElementSearch = vi.fn();
const mockGetSampleImages = vi.fn();
const mockGetServerConfig = vi.fn();

vi.mock('../src/api/existing-element-search/index.js', () => ({
  existingElementSearch: (...args: unknown[]) =>
    mockExistingElementSearch(...args),
}));
vi.mock('../src/api/new-element-search/index.js', () => ({
  newElementSearch: (...args: unknown[]) => mockNewElementSearch(...args),
}));
vi.mock('../src/api/get-sample-images/index.js', () => ({
  getSampleImages: (...args: unknown[]) => mockGetSampleImages(...args),
}));
vi.mock('../src/api/get-server-config/index.js', () => ({
  getServerConfig: (...args: unknown[]) => mockGetServerConfig(...args),
}));
vi.mock('../src/upload.js', () => ({
  addImageUploadRoute: vi.fn(),
}));

import { router } from '../src/routes.js';
import express from 'express';
import { createServer } from 'http';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
}

async function postJSON(
  app: express.Express,
  path: string,
  body: unknown = {},
) {
  const server = createServer(app);

  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    server.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        return reject(new Error('Failed to get server address'));
      }

      const bodyStr = JSON.stringify(body);
      const req = require('http').request(
        {
          hostname: '127.0.0.1',
          port: addr.port,
          path: `/api${path}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(bodyStr),
          },
        },
        (res: any) => {
          let data = '';
          res.on('data', (chunk: string) => (data += chunk));
          res.on('end', () => {
            server.close();
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          });
        },
      );
      req.on('error', (err: Error) => {
        server.close();
        reject(err);
      });
      req.write(bodyStr);
      req.end();
    });
  });
}

describe('routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /test returns data='Test API'", async () => {
    const app = createTestApp();
    const res = await postJSON(app, '/test');
    expect(res.status).toBe(200);
    expect(res.body.data).toBe('Test API');
    expect(res.body.error).toBeNull();
  });

  it('POST /existingElementSearch returns data on success', async () => {
    mockExistingElementSearch.mockResolvedValue({
      query: 'VSIM ...',
      queryResults: [],
    });
    const app = createTestApp();
    const res = await postJSON(app, '/existingElementSearch', { id: 'e1' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ query: 'VSIM ...', queryResults: [] });
    expect(res.body.error).toBeNull();
  });

  it('POST /existingElementSearch returns error on failure', async () => {
    mockExistingElementSearch.mockRejectedValue(new Error('Redis down'));
    const app = createTestApp();
    const res = await postJSON(app, '/existingElementSearch', { id: 'e1' });
    expect(res.body.error).toBeTruthy();
    expect(res.body.data).toBeNull();
  });

  it('POST /newElementSearch returns data on success', async () => {
    mockNewElementSearch.mockResolvedValue({
      query: 'VSIM VALUES ...',
      queryResults: [],
    });
    const app = createTestApp();
    const res = await postJSON(app, '/newElementSearch', {
      localImageUrl: '/img.jpg',
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      query: 'VSIM VALUES ...',
      queryResults: [],
    });
  });

  it('POST /getSampleImages returns data on success', async () => {
    mockGetSampleImages.mockResolvedValue([{ id: 'e1' }]);
    const app = createTestApp();
    const res = await postJSON(app, '/getSampleImages', {});
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([{ id: 'e1' }]);
  });

  it('POST /getServerConfig returns data on success', async () => {
    mockGetServerConfig.mockResolvedValue({ basePath: '' });
    const app = createTestApp();
    const res = await postJSON(app, '/getServerConfig');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ basePath: '' });
  });
});
