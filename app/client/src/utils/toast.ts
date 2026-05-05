import toast from 'react-hot-toast';

const baseToastStyle = {
  background: 'var(--surface-02)',
  color: 'var(--fg-default)',
  border: '1px solid var(--border)',
  fontFamily: 'var(--primary-font)',
};

export function showErrorToast(message: string, error?: unknown) {
  if (error) {
    console.error('Error:', error);
  }

  toast.error(
    message || 'Something went wrong. Check the console for details.',
    {
      duration: 5000,
      position: 'top-right',
      style: {
        ...baseToastStyle,
        border: '1px solid #EB352A',
        background: '#351D22',
        color: '#FFFFFF',
      },
    },
  );
}

export function showSuccessToast(message: string) {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      ...baseToastStyle,
      border: '1px solid #A9CA03',
      color: '#DCFF1E',
    },
  });
}

export function showInfoToast(message: string) {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      ...baseToastStyle,
      border: '1px solid #8A99A0',
      color: '#D9D9D9',
    },
  });
}
