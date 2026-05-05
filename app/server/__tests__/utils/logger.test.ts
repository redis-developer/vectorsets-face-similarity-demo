import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPureError,
  CustomErrorCls,
  logDebug,
  log,
  logInfo,
  logError,
} from '../../src/utils/logger.js';

describe('getPureError', () => {
  it('returns a string input as-is', () => {
    expect(getPureError('some error')).toBe('some error');
  });

  it('serializes an Error into a plain object with message and stack', () => {
    const err = new Error('test error');
    const result = getPureError(err) as Record<string, unknown>;
    expect(result).toHaveProperty('message', 'test error');
    expect(result).toHaveProperty('stack');
  });

  it('returns a JSON string when isStringifyOnly is true', () => {
    const err = new Error('stringify only');
    const result = getPureError(err, true);
    expect(typeof result).toBe('string');
    expect(result).toContain('stringify only');
  });

  it('serializes a plain object', () => {
    const obj = { foo: 'bar', num: 42 };
    const result = getPureError(obj) as Record<string, unknown>;
    expect(result).toEqual({ foo: 'bar', num: 42 });
  });
});

describe('CustomErrorCls', () => {
  it('sets message and name', () => {
    const err = new CustomErrorCls('internal error');
    expect(err.message).toBe('internal error');
    expect(err.name).toBe('CustomError');
    expect(err.userMessage).toBe('');
  });

  it('sets userMessage when provided', () => {
    const err = new CustomErrorCls('internal error', 'Something went wrong');
    expect(err.userMessage).toBe('Something went wrong');
  });

  it('is an instance of Error', () => {
    const err = new CustomErrorCls('test');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('log functions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logDebug calls console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logDebug('debug message');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('log calls console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log('info message');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('logInfo calls console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logInfo('info message');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('logError calls console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logError('error message');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('logDebug with details calls console.log twice', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logDebug('debug message', { key: 'value' });
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
