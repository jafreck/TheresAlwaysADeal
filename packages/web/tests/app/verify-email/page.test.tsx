import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

let mockToken: string | null = 'valid-token';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement('a', { href, ...props }, children as React.ReactNode),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'token' ? mockToken : null),
  }),
}));

const mockGet = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiClient: { get: (...args: unknown[]) => mockGet(...args) },
  ApiError: class ApiError extends Error {
    status: number;
    statusText: string;
    body: unknown;
    constructor(status: number, statusText: string, body: unknown) {
      super(`API error ${status}: ${statusText}`);
      this.name = 'ApiError';
      this.status = status;
      this.statusText = statusText;
      this.body = body;
    }
  },
}));

vi.mock('@/components/LoadingSpinner', () => ({
  default: ({ size, className }: { size?: number; className?: string }) =>
    React.createElement('div', { 'data-testid': 'loading-spinner', 'data-size': size, className }),
}));

import VerifyEmailPage from '../../../src/app/verify-email/page';

// We need to get the mocked ApiError for throwing
const { ApiError } = await import('../../../src/lib/api-client');

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'valid-token';
  });

  it('should show loading state initially when token is present', () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<VerifyEmailPage />);
    const status = container.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect(container.textContent).toContain('Verifying your email');
  });

  it('should show success state after successful verification', async () => {
    mockGet.mockResolvedValue({});
    const { container } = render(<VerifyEmailPage />);

    await waitFor(() => {
      const h1 = container.querySelector('h1');
      expect(h1?.textContent).toBe('Email Verified');
    });
    expect(container.textContent).toContain('Your email has been verified successfully.');
  });

  it('should call API with correct URL including token', async () => {
    mockGet.mockResolvedValue({});
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/api/auth/verify-email?token=valid-token');
    });
  });

  it('should render link to /login on success', async () => {
    mockGet.mockResolvedValue({});
    const { container } = render(<VerifyEmailPage />);

    await waitFor(() => {
      const link = container.querySelector('a[href="/login"]');
      expect(link).toBeTruthy();
      expect(link?.textContent).toBe('Go to Sign In');
    });
  });

  it('should show error for missing token', () => {
    mockToken = null;
    const { container } = render(<VerifyEmailPage />);
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('Verification Failed');
    expect(container.textContent).toContain('Missing verification token.');
  });

  it('should not call API when token is missing', () => {
    mockToken = null;
    render(<VerifyEmailPage />);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should show error message on API error', async () => {
    mockGet.mockRejectedValue(new ApiError(400, 'Bad Request', { message: 'Token expired' }));
    const { container } = render(<VerifyEmailPage />);

    await waitFor(() => {
      const h1 = container.querySelector('h1');
      expect(h1?.textContent).toBe('Verification Failed');
    });
    expect(container.textContent).toContain('Token expired');
  });

  it('should show generic error for unexpected errors', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    const { container } = render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(container.textContent).toContain('An unexpected error occurred.');
    });
  });

  it('should render link to /login on error', async () => {
    mockToken = null;
    const { container } = render(<VerifyEmailPage />);
    const link = container.querySelector('a[href="/login"]');
    expect(link).toBeTruthy();
  });

  it('should encode token in API URL', async () => {
    mockToken = 'token with spaces&special=chars';
    mockGet.mockResolvedValue({});
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        `/api/auth/verify-email?token=${encodeURIComponent('token with spaces&special=chars')}`,
      );
    });
  });
});
