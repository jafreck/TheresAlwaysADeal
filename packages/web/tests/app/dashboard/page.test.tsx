import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard',
}));

const mockUseAuth = vi.fn();
vi.mock('@/lib/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'protected-route' }, children),
}));

vi.mock('@/components/LoadingSpinner', () => ({
  default: ({ size }: { size?: number }) =>
    React.createElement('div', { 'data-testid': 'loading-spinner', 'data-size': size }),
}));

vi.mock('@/components/AdSlot', () => ({
  default: function MockAdSlot(props: Record<string, unknown>) {
    return React.createElement('div', { 'data-testid': 'ad-slot', 'data-slot-id': props.slotId });
  },
}));

import DashboardPage from '../../../src/app/dashboard/page';

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      isLoading: false,
    });
  });

  it('should render within ProtectedRoute', () => {
    const { container } = render(<DashboardPage />);
    expect(container.querySelector('[data-testid="protected-route"]')).toBeTruthy();
  });

  it('should render a welcome heading with user name', () => {
    const { container } = render(<DashboardPage />);
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('Welcome, Test User!');
  });

  it('should render welcome heading without name when user has no name', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
      isLoading: false,
    });
    const { container } = render(<DashboardPage />);
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('Welcome!');
  });

  it('should render description text', () => {
    const { container } = render(<DashboardPage />);
    expect(container.textContent).toContain('This is your dashboard. More features coming soon.');
  });

  it('should render the heading as h1', () => {
    const { container } = render(<DashboardPage />);
    const h1 = container.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent).toContain('Welcome');
  });

  it('should render AdSlot with dashboard-banner slotId', () => {
    const { container } = render(<DashboardPage />);
    const adSlot = container.querySelector('[data-testid="ad-slot"]');
    expect(adSlot).toBeTruthy();
    expect(adSlot?.getAttribute('data-slot-id')).toBe('dashboard-banner');
  });

  it('should render AdSlot after dashboard text content', () => {
    const { container } = render(<DashboardPage />);
    const h1 = container.querySelector('h1');
    const adSlot = container.querySelector('[data-testid="ad-slot"]');
    expect(h1).toBeTruthy();
    expect(adSlot).toBeTruthy();
    // AdSlot should appear after the heading in DOM order
    const allElements = Array.from(container.querySelectorAll('*'));
    const h1Idx = allElements.indexOf(h1!);
    const adIdx = allElements.indexOf(adSlot!);
    expect(adIdx).toBeGreaterThan(h1Idx);
  });
});
