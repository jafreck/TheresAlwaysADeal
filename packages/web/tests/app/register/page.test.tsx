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

const mockRegister = vi.fn();
vi.mock('@/lib/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    register: mockRegister,
    user: null,
    isLoading: false,
    login: vi.fn(),
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

import RegisterPage from '../../../src/app/register/page';
import { ApiError } from '../../../src/lib/api-client';

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegister.mockResolvedValue(undefined);
  });

  it('should render the Create Account heading', () => {
    const { container } = render(<RegisterPage />);
    const h1 = container.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent).toBe('Create Account');
  });

  it('should render within AuthLayout', () => {
    const { container } = render(<RegisterPage />);
    expect(container.querySelector('[data-testid="auth-layout"]')).toBeTruthy();
  });

  it('should render name, email, password, and confirmPassword fields', () => {
    const { container } = render(<RegisterPage />);
    expect(container.querySelector('input#name')).toBeTruthy();
    expect(container.querySelector('input#email')).toBeTruthy();
    expect(container.querySelector('input#password')).toBeTruthy();
    expect(container.querySelector('input#confirmPassword')).toBeTruthy();
  });

  it('should render labels for all form fields', () => {
    const { container } = render(<RegisterPage />);
    expect(container.querySelector('label[for="name"]')?.textContent).toContain('Display Name');
    expect(container.querySelector('label[for="email"]')?.textContent).toContain('Email');
    expect(container.querySelector('label[for="password"]')?.textContent).toContain('Password');
    expect(container.querySelector('label[for="confirmPassword"]')?.textContent).toContain('Confirm Password');
  });

  it('should render a submit button with text "Create Account"', () => {
    const { container } = render(<RegisterPage />);
    const btn = container.querySelector('button[type="submit"]');
    expect(btn).toBeTruthy();
    expect(btn?.textContent).toContain('Create Account');
  });

  it('should render a Google OAuth placeholder button', () => {
    const { container } = render(<RegisterPage />);
    const buttons = container.querySelectorAll('button[type="button"]');
    const googleBtn = Array.from(buttons).find((b) => b.textContent?.includes('Continue with Google'));
    expect(googleBtn).toBeTruthy();
  });

  it('should render a link to /login', () => {
    const { container } = render(<RegisterPage />);
    const link = container.querySelector('a[href="/login"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toBe('Sign In');
  });

  it('should show password strength indicator when password is typed', () => {
    const { container } = render(<RegisterPage />);
    const passwordInput = container.querySelector('input#password')!;
    fireEvent.change(passwordInput, { target: { value: 'abc' } });
    const strengthEl = container.querySelector('[aria-label]');
    expect(strengthEl).toBeTruthy();
  });

  it('should show "Weak" strength for short password', () => {
    const { container } = render(<RegisterPage />);
    const passwordInput = container.querySelector('input#password')!;
    fireEvent.change(passwordInput, { target: { value: 'abc' } });
    expect(container.textContent).toContain('Weak');
  });

  it('should show "Fair" strength for medium password', () => {
    const { container } = render(<RegisterPage />);
    const passwordInput = container.querySelector('input#password')!;
    fireEvent.change(passwordInput, { target: { value: 'Password' } });
    expect(container.textContent).toContain('Fair');
  });

  it('should show "Good" strength for good password', () => {
    const { container } = render(<RegisterPage />);
    const passwordInput = container.querySelector('input#password')!;
    fireEvent.change(passwordInput, { target: { value: 'Password1' } });
    expect(container.textContent).toContain('Good');
  });

  it('should show "Strong" strength for complex password', () => {
    const { container } = render(<RegisterPage />);
    const passwordInput = container.querySelector('input#password')!;
    fireEvent.change(passwordInput, { target: { value: 'MyStr0ng!Pass' } });
    expect(container.textContent).toContain('Strong');
  });

  it('should not show strength indicator when password is empty', () => {
    const { container } = render(<RegisterPage />);
    const strengthEl = container.querySelector('[id="password-strength"]');
    expect(strengthEl).toBeNull();
  });

  it('should show validation errors for empty email on submit', async () => {
    const { container } = render(<RegisterPage />);
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      const alerts = container.querySelectorAll('[role="alert"]');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('should show success message after successful registration', async () => {
    mockRegister.mockResolvedValue(undefined);
    const { container } = render(<RegisterPage />);

    fireEvent.change(container.querySelector('input#name')!, { target: { value: 'Test' } });
    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input#password')!, { target: { value: 'securepass' } });
    fireEvent.change(container.querySelector('input#confirmPassword')!, { target: { value: 'securepass' } });

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(container.textContent).toContain('Check your email to verify your account');
    });
  });

  it('should show server error message on ApiError', async () => {
    mockRegister.mockRejectedValue(new ApiError(409, 'Conflict', { message: 'Email already registered' }));
    const { container } = render(<RegisterPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input#password')!, { target: { value: 'securepass' } });
    fireEvent.change(container.querySelector('input#confirmPassword')!, { target: { value: 'securepass' } });

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(container.textContent).toContain('Email already registered');
    });
  });

  it('should show generic error for unexpected errors', async () => {
    mockRegister.mockRejectedValue(new Error('Network error'));
    const { container } = render(<RegisterPage />);

    fireEvent.change(container.querySelector('input#email')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input#password')!, { target: { value: 'securepass' } });
    fireEvent.change(container.querySelector('input#confirmPassword')!, { target: { value: 'securepass' } });

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(container.textContent).toContain('An unexpected error occurred.');
    });
  });

  it('should have proper autocomplete attributes on inputs', () => {
    const { container } = render(<RegisterPage />);
    expect(container.querySelector('input#name')?.getAttribute('autocomplete')).toBe('name');
    expect(container.querySelector('input#email')?.getAttribute('autocomplete')).toBe('email');
    expect(container.querySelector('input#password')?.getAttribute('autocomplete')).toBe('new-password');
    expect(container.querySelector('input#confirmPassword')?.getAttribute('autocomplete')).toBe('new-password');
  });
});
