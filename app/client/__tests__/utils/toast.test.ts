import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from '../../src/utils/toast';

vi.mock('react-hot-toast', () => {
  const mockToast = vi.fn();
  mockToast.error = vi.fn();
  mockToast.success = vi.fn();
  return { default: mockToast };
});

describe('showErrorToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.error with the message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    showErrorToast('Something went wrong');
    expect(toast.error).toHaveBeenCalledWith(
      'Something went wrong',
      expect.any(Object),
    );
    spy.mockRestore();
  });

  it('uses fallback message when message is empty', () => {
    showErrorToast('');
    expect(toast.error).toHaveBeenCalledWith(
      'Something went wrong. Check the console for details.',
      expect.any(Object),
    );
  });

  it('logs error details to console when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errorObj = { code: 500 };
    showErrorToast('Error', errorObj);
    expect(spy).toHaveBeenCalledWith('Error:', errorObj);
    spy.mockRestore();
  });

  it('sets duration to 5000ms', () => {
    showErrorToast('test');
    const callArgs = (toast.error as any).mock.calls[0][1];
    expect(callArgs.duration).toBe(5000);
  });
});

describe('showSuccessToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.success with the message', () => {
    showSuccessToast('Done!');
    expect(toast.success).toHaveBeenCalledWith('Done!', expect.any(Object));
  });

  it('sets duration to 3000ms', () => {
    showSuccessToast('test');
    const callArgs = (toast.success as any).mock.calls[0][1];
    expect(callArgs.duration).toBe(3000);
  });
});

describe('showInfoToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast with the message', () => {
    showInfoToast('Info message');
    expect(toast).toHaveBeenCalledWith('Info message', expect.any(Object));
  });

  it('sets duration to 3000ms', () => {
    showInfoToast('test');
    const callArgs = (toast as any).mock.calls[0][1];
    expect(callArgs.duration).toBe(3000);
  });
});
