import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
let mockToken: string | null = 'reset-token';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement('a', { href, ...props }, children as React.ReactNode),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'token' ? mockToken : null),
  }),
}));

vi.mock('@/lib/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockPost = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiClient: { post: (...args: unknown[]) => mockPost(...args) },
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

vi.mock('@/components/AuthLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'auth-layout' }, children),
}));

vi.mock('@/components/LoadingSpinner', () => ({
  default: ({ size }: { size?: number }) =>
    React.createElement('div', { 'data-testid': 'loading-spinner', 'data-size': size }),
}));

import ResetPasswordPage from '../../../src/app/reset-password/page';

const { ApiError } = await import('../../../src/lib/api-client');

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'reset-token';
    mockPost.mockResolvedValue({});
  });

  it('should render the "Reset Password" heading', () => {
    const { container } = render(<ResetPasswordPage />);
    const h1 = container.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent).toBe('Reset Password');
  });

  it('should render within AuthLayout', () => {
    const { container } = render(<ResetPasswordPage />);
    expect(container.querySelector('[data-testid="auth-layout"]')).toBeTruthy();
  });

  it('should render password and confirmPassword fields', () => {
    const { container } = render(<ResetPasswordPage />);
    expect(container.querySelector('input[id="password"]')).toBeTruthy();
    expect(container.querySelector('input[id="confirmPassword"]')).toBeTruthy();
  });

  it('should render labels for form fields', () => {
    const { container } = render(<ResetPasswordPage />);
    expect(container.querySelector('label[for="password"]')?.textContent).toContain('New Password');
    expect(container.querySelector('label[for="confirmPassword"]')?.textContent).toContain('Confirm Password');
  });

  it('should render a submit button', () => {
    const { container } = render(<ResetPasswordPage />);
    const btn = container.querySelector('button[type="submit"]');
    expect(btn).toBeTruthy();
    expect(btn?.textContent).toContain('Reset Password');
  });

  it('should show error when token is missing', () => {
    mockToken = null;
    const { container } = render(<ResetPasswordPage />);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('Missing or invalid reset token');
  });

  it('should disable submit button when token is missing', () => {
    mockToken = null;
    const { container } = render(<ResetPasswordPage />);
    const btn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('should redirect to /login on successful reset', async () => {
    const { container } = render(<ResetPasswordPage />);

    fireEvent.change(container.querySelector('input[id="password"]')!, { target: { value: 'newpasswd' } });
    fireEvent.change(container.querySelector('input[id="confirmPassword"]')!, { target: { value: 'newpasswd' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/auth/reset-password', {
        token: 'reset-token',
        password: 'newpasswd',
      });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should show server error on ApiError', async () => {
    mockPost.mockRejectedValue(new ApiError(400, 'Bad Request', { message: 'Token expired' }));
    const { container } = render(<ResetPasswordPage />);

    fireEvent.change(container.querySelector('input[id="password"]')!, { target: { value: 'newpasswd' } });
    fireEvent.change(container.querySelector('input[id="confirmPassword"]')!, { target: { value: 'newpasswd' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(container.textContent).toContain('Token expired');
    });
  });

  it('should show generic error for unexpected errors', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));
    const { container } = render(<ResetPasswordPage />);

    fireEvent.change(container.querySelector('input[id="password"]')!, { target: { value: 'newpasswd' } });
    fireEvent.change(container.querySelector('input[id="confirmPassword"]')!, { target: { value: 'newpasswd' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(container.textContent).toContain('An unexpected error occurred.');
    });
  });

  it('should show validation errors when passwords do not match', async () => {
    const { container } = render(<ResetPasswordPage />);

    fireEvent.change(container.querySelector('input[id="password"]')!, { target: { value: 'newpasswd' } });
    fireEvent.change(container.querySelector('input[id="confirmPassword"]')!, { target: { value: 'different' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      const alerts = container.querySelectorAll('[role="alert"]');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('should have proper autocomplete attributes', () => {
    const { container } = render(<ResetPasswordPage />);
    expect(container.querySelector('input[id="password"]')?.getAttribute('autocomplete')).toBe('new-password');
    expect(container.querySelector('input[id="confirmPassword"]')?.getAttribute('autocomplete')).toBe('new-password');
  });
});
