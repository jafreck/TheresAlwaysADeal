import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('@/lib/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/lib/useAuth';
import AuthLayout from '../../src/components/AuthLayout';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('AuthLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    const { getByText } = render(
      <AuthLayout>
        <div>Login Form</div>
      </AuthLayout>,
    );
    expect(getByText('Login Form')).toBeTruthy();
  });

  it('should render a centered card layout', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    const { container } = render(
      <AuthLayout>
        <div>content</div>
      </AuthLayout>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('min-h-screen');
    expect(wrapper.className).toContain('items-center');
    expect(wrapper.className).toContain('justify-center');

    const card = wrapper.firstElementChild as HTMLElement;
    expect(card.className).toContain('max-w-md');
    expect(card.className).toContain('rounded-lg');
  });

  it('should redirect to /dashboard when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    render(
      <AuthLayout>
        <div>Login Form</div>
      </AuthLayout>,
    );
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('should render nothing when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    const { container } = render(
      <AuthLayout>
        <div>Login Form</div>
      </AuthLayout>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('should not redirect when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    render(
      <AuthLayout>
        <div>Login Form</div>
      </AuthLayout>,
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
