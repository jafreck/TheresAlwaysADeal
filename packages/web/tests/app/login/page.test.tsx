import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement('a', { href, ...props }, children as React.ReactNode),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

const mockLogin = vi.fn();
vi.mock('@/lib/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    login: mockLogin,
    user: null,
    isLoading: false,
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@/components/AuthLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'auth-layout' }, children),
}));

vi.mock('@/components/LoadingSpinner', () => ({
  default: ({ size }: { size?: number }) =>
    React.createElement('div', { 'data-testid': 'loading-spinner', 'data-size': size }),
}));

import LoginPage from '../../../src/app/login/page';
import { ApiError } from '../../../src/lib/api-client';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    // Reset search params
    mockSearchParams.delete('redirect');
  });

  it('should render the Sign In heading', () => {
    const { container } = render(<LoginPage />);
    const h1 = container.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent).toBe('Sign In');
  });

  it('should render within AuthLayout', () => {
    const { container } = render(<LoginPage />);
    expect(container.querySelector('[data-testid="auth-layout"]')).toBeTruthy();
  });

  it('should render email and password fields', () => {
    const { container } = render(<LoginPage />);
    expect(container.querySelector('input#email')).toBeTruthy();
    expect(container.querySelector('input#password')).toBeTruthy();
  });

  it('should render labels for form fields', () => {
    const { container } = render(<LoginPage />);
    expect(container.querySelector('label[for="email"]')?.textContent).toContain('Email');
    expect(container.querySelector('label[for="password"]')?.textContent).toContain('Password');
  });

  it('should render a password show/hide toggle button', () => {
    const { container } = render(<LoginPage />);
    const toggleBtn = container.querySelector('button[aria-label="Show password"]');
    expect(toggleBtn).toBeTruthy();
  });

  it('should toggle password visibility when toggle is clicked', () => {
    const { container } = render(<LoginPage />);
    const passwordInput = container.querySelector('input#password')!;
    expect(passwordInput.getAttribute('type')).toBe('password');

    const toggleBtn = container.querySelector('button[aria-label="Show password"]')!;
    fireEvent.click(toggleBtn);
    expect(passwordInput.getAttribute('type')).toBe('text');

    const hideBtn = container.querySelector('button[aria-label="Hide password"]')!;
    fireEvent.click(hideBtn);
    expect(passwordInput.getAttribute('type')).toBe('password');
  });

  it('should render a "Remember me" checkbox', () => {
    const { container } = render(<LoginPage />);
    const checkbox = container.querySelector('input[type="checkbox"][aria-label="Remember me"]');
    expect(checkbox).toBeTruthy();
  });

  it('should render a "Forgot password?" link to /forgot-password', () => {
    const { container } = render(<LoginPage />);
    const link = container.querySelector('a[href="/forgot-password"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toBe('Forgot password?');
  });

  it('should render a link to /register', () => {
    const { container } = render(<LoginPage />);
    const link = container.querySelector('a[href="/register"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toBe('Create Account');
  });

  it('should render a Google OAuth placeholder button', () => {
    const { container } = render(<LoginPage />);
    const buttons = container.querySelectorAll('button[type="button"]');
    const googleBtn = Array.from(buttons).find((b) => b.textContent?.includes('Continue with Google'));
    expect(googleBtn).toBeTruthy();
  });

  it('should render a submit button with text "Sign In"', () => {
    const { container } = render(<LoginPage />);
    const btn = container.querySelector('button[type="submit"]');
    expect(btn).toBeTruthy();
    expect(btn?.textContent).toContain('Sign In');
  });

  it('should redirect to /dashboard on successful login', async () => {
    const { container } = render(<LoginPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input#password')!, { target: { value: 'password' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should redirect to custom redirect URL from search params', async () => {
    mockSearchParams.set('redirect', '/profile');
    const { container } = render(<LoginPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input#password')!, { target: { value: 'password' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });
  });

  it('should block external redirect URLs (open redirect protection)', async () => {
    mockSearchParams.set('redirect', 'https://evil.com');
    const { container } = render(<LoginPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input#password')!, { target: { value: 'password' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should block protocol-relative redirect URLs', async () => {
    mockSearchParams.set('redirect', '//evil.com');
    const { container } = render(<LoginPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input#password')!, { target: { value: 'password' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show server error on ApiError', async () => {
    mockLogin.mockRejectedValue(new ApiError(401, 'Unauthorized', { message: 'Invalid email or password' }));
    const { container } = render(<LoginPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input#password')!, { target: { value: 'wrongpass' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(container.textContent).toContain('Invalid email or password');
    });
  });

  it('should show generic error for unexpected errors', async () => {
    mockLogin.mockRejectedValue(new Error('Network failure'));
    const { container } = render(<LoginPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input#password')!, { target: { value: 'password' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(container.textContent).toContain('An unexpected error occurred.');
    });
  });

  it('should show validation errors for empty form submission', async () => {
    const { container } = render(<LoginPage />);
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      const alerts = container.querySelectorAll('[role="alert"]');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('should have proper autocomplete attributes', () => {
    const { container } = render(<LoginPage />);
    expect(container.querySelector('input#email')?.getAttribute('autocomplete')).toBe('email');
    expect(container.querySelector('input#password')?.getAttribute('autocomplete')).toBe('current-password');
  });
});
