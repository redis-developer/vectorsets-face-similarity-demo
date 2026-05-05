import { describe, it, expect } from 'vitest';

import {
  API_BASE_URL,
  IMAGE_BASE_URL,
  MAX_UPLOAD_FILE_SIZE,
} from '../../src/utils/config';

describe('config', () => {
  it('exports API_BASE_URL', () => {
    expect(typeof API_BASE_URL).toBe('string');
  });

  it('exports IMAGE_BASE_URL', () => {
    expect(typeof IMAGE_BASE_URL).toBe('string');
  });

  it('exports MAX_UPLOAD_FILE_SIZE', () => {
    expect(MAX_UPLOAD_FILE_SIZE).toBeGreaterThan(0);
  });
});
