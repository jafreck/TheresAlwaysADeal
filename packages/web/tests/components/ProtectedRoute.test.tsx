import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/dashboard/settings',
}));

vi.mock('@/lib/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../src/components/LoadingSpinner', () => ({
  default: ({ size }: { size?: number }) =>
    React.createElement('div', { 'data-testid': 'loading-spinner', 'data-size': size }),
}));

import { useAuth } from '@/lib/useAuth';
import ProtectedRoute from '../../src/components/ProtectedRoute';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when authenticated and not loading', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    const { getByText } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );
    expect(getByText('Protected Content')).toBeTruthy();
  });

  it('should show loading spinner when isLoading is true', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    const { getByTestId } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('should render accessible loading status', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    const { container } = render(
      <ProtectedRoute>
        <div>content</div>
      </ProtectedRoute>,
    );
    const statusEl = container.querySelector('[role="status"]');
    expect(statusEl).toBeTruthy();
    expect(statusEl?.getAttribute('aria-label')).toBe('Checking authentication');
  });

  it('should redirect to login with redirect param when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );
    expect(mockReplace).toHaveBeenCalledWith(
      '/login?redirect=%2Fdashboard%2Fsettings',
    );
  });

  it('should render nothing when not authenticated and not loading', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('should not redirect when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
