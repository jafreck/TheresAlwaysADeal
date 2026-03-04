import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement('a', { href, ...props }, children as React.ReactNode),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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
}));

vi.mock('@/components/AuthLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'auth-layout' }, children),
}));

vi.mock('@/components/LoadingSpinner', () => ({
  default: ({ size }: { size?: number }) =>
    React.createElement('div', { 'data-testid': 'loading-spinner', 'data-size': size }),
}));

import ForgotPasswordPage from '../../../src/app/forgot-password/page';

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({});
  });

  it('should render the "Forgot Password" heading', () => {
    const { container } = render(<ForgotPasswordPage />);
    const h1 = container.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent).toBe('Forgot Password');
  });

  it('should render within AuthLayout', () => {
    const { container } = render(<ForgotPasswordPage />);
    expect(container.querySelector('[data-testid="auth-layout"]')).toBeTruthy();
  });

  it('should render an email field with label', () => {
    const { container } = render(<ForgotPasswordPage />);
    expect(container.querySelector('label[for="email"]')?.textContent).toContain('Email');
    expect(container.querySelector('input#email')).toBeTruthy();
  });

  it('should render a "Send Reset Link" submit button', () => {
    const { container } = render(<ForgotPasswordPage />);
    const btn = container.querySelector('button[type="submit"]');
    expect(btn).toBeTruthy();
    expect(btn?.textContent).toContain('Send Reset Link');
  });

  it('should render a link back to /login', () => {
    const { container } = render(<ForgotPasswordPage />);
    const link = container.querySelector('a[href="/login"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toBe('Back to Sign In');
  });

  it('should show generic success message after successful submission', async () => {
    const { container } = render(<ForgotPasswordPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(container.textContent).toContain("If that email is registered, you'll receive a reset link");
    });
  });

  it('should show generic success message even when API errors', async () => {
    mockPost.mockRejectedValue(new Error('Server error'));
    const { container } = render(<ForgotPasswordPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(container.textContent).toContain("If that email is registered, you'll receive a reset link");
    });
  });

  it('should call API with email on submission', async () => {
    const { container } = render(<ForgotPasswordPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'test@example.com' });
    });
  });

  it('should show validation error for invalid email', async () => {
    const { container } = render(<ForgotPasswordPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'not-email' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      const alerts = container.querySelectorAll('[role="alert"]');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('should render "Back to Sign In" link in success state', async () => {
    const { container } = render(<ForgotPasswordPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      const link = container.querySelector('a[href="/login"]');
      expect(link).toBeTruthy();
      expect(link?.textContent).toBe('Back to Sign In');
    });
  });

  it('should have proper autocomplete on email input', () => {
    const { container } = render(<ForgotPasswordPage />);
    expect(container.querySelector('input#email')?.getAttribute('autocomplete')).toBe('email');
  });
});
