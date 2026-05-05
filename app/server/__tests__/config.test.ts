import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getConfig } from '../src/config.js';

describe('getConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns an object with expected keys', () => {
    const config = getConfig();
    expect(config).toHaveProperty('ENV');
    expect(config).toHaveProperty('ROOT_DIR');
    expect(config).toHaveProperty('BASE_PATH');
    expect(config).toHaveProperty('REDIS_URL');
    expect(config).toHaveProperty('PORT');
    expect(config).toHaveProperty('UPLOAD_DIR');
    expect(config).toHaveProperty('UPLOAD_MAX_FILE_SIZE');
    expect(config).toHaveProperty('DATASET');
    expect(config).toHaveProperty('GEMINI_API_KEY');
  });

  it('defaults BASE_PATH to empty string', () => {
    delete process.env.BASE_PATH;
    const config = getConfig();
    expect(config.BASE_PATH).toBe('');
  });

  it('uses BASE_PATH from environment and strips trailing slash', () => {
    process.env.BASE_PATH = '/my-app/';
    const config = getConfig();
    expect(config.BASE_PATH).toBe('/my-app');
  });

  it('prepends BASE_PATH to dataset IMAGE_PREFIX', () => {
    process.env.BASE_PATH = '/demo';
    const config = getConfig();
    expect(config.DATASET.IMAGE_PREFIX).toBe('/demo/static/faces/');
  });

  it('uses default REDIS_URL when env is not set', () => {
    delete process.env.REDIS_URL;
    const config = getConfig();
    expect(config.REDIS_URL).toBe('redis://localhost:6379');
  });

  it('uses REDIS_URL from environment', () => {
    process.env.REDIS_URL = 'redis://custom:6380';
    const config = getConfig();
    expect(config.REDIS_URL).toBe('redis://custom:6380');
  });

  it('uses default PORT when env is not set', () => {
    delete process.env.PORT;
    const config = getConfig();
    expect(config.PORT).toBe('3000');
  });

  it('uses PORT from environment', () => {
    process.env.PORT = '8080';
    const config = getConfig();
    expect(config.PORT).toBe('8080');
  });

  it('sets UPLOAD_MAX_FILE_SIZE to 10MB', () => {
    const config = getConfig();
    expect(config.UPLOAD_MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
  });

  it('has vset:faces as the dataset key', () => {
    const config = getConfig();
    expect(config.DATASET.VECTOR_SET.KEY).toBe('vset:faces');
    expect(config.DATASET.VECTOR_SET.DIM).toBe(3072);
  });
});
