import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();

vi.mock('next/link', () => ({
  default: ({ children, href, onClick, ...props }: Record<string, unknown>) =>
    React.createElement(
      'a',
      {
        href,
        ...props,
        onClick: (e: Event) => {
          e.preventDefault();
          if (typeof onClick === 'function') (onClick as (e: Event) => void)(e);
        },
      },
      children as React.ReactNode,
    ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseAuth = vi.fn();
vi.mock('@/lib/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

import Header from '../../src/components/Header';

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    });
  });

  it('should be a function (React component)', () => {
    expect(typeof Header).toBe('function');
  });

  it('should render a header element', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
  });

  it('should have sticky positioning', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header?.className).toContain('sticky');
    expect(header?.className).toContain('top-0');
  });

  it('should render the logo link with correct text', () => {
    const { container } = render(<Header />);
    const links = container.querySelectorAll('a');
    const logoLink = Array.from(links).find((l) => l.getAttribute('href') === '/');
    expect(logoLink).toBeTruthy();
    expect(logoLink?.textContent).toContain('Always a Deal');
  });

  it('should render a search input with placeholder', () => {
    const { container } = render(<Header />);
    const searchInputs = container.querySelectorAll('input[type="search"]');
    expect(searchInputs.length).toBeGreaterThanOrEqual(1);
    expect(searchInputs[0].getAttribute('placeholder')).toBe('Search games...');
  });

  it('should render search input with aria-label', () => {
    const { container } = render(<Header />);
    const searchInput = container.querySelector('input[type="search"]');
    expect(searchInput?.getAttribute('aria-label')).toBe('Search games');
  });

  it('should render desktop nav links for Deals, Free Games, and Stores', () => {
    const { container } = render(<Header />);
    const nav = container.querySelector('nav[aria-label="Main navigation"]');
    expect(nav).toBeTruthy();
    const links = nav!.querySelectorAll('a');
    const hrefs = Array.from(links).map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/deals');
    expect(hrefs).toContain('/free-games');
    expect(hrefs).toContain('/stores');
  });

  it('should render desktop nav with hidden md:flex classes', () => {
    const { container } = render(<Header />);
    const nav = container.querySelector('nav[aria-label="Main navigation"]');
    expect(nav?.className).toContain('hidden');
    expect(nav?.className).toContain('md:flex');
  });

  it('should render a Sign In link when unauthenticated', () => {
    const { container } = render(<Header />);
    const links = container.querySelectorAll('a');
    const signInLink = Array.from(links).find((l) => l.textContent === 'Sign In' && l.getAttribute('href') === '/login');
    expect(signInLink).toBeTruthy();
  });

  it('should render a hamburger menu button with aria-label', () => {
    const { container } = render(<Header />);
    const menuBtn = container.querySelector('button[aria-label="Toggle menu"]');
    expect(menuBtn).toBeTruthy();
  });

  it('should have aria-expanded="false" on hamburger button initially', () => {
    const { container } = render(<Header />);
    const menuBtn = container.querySelector('button[aria-label="Toggle menu"]');
    expect(menuBtn?.getAttribute('aria-expanded')).toBe('false');
  });

  it('should have md:hidden class on hamburger button', () => {
    const { container } = render(<Header />);
    const menuBtn = container.querySelector('button[aria-label="Toggle menu"]');
    expect(menuBtn?.className).toContain('md:hidden');
  });

  it('should not show mobile menu initially', () => {
    const { container } = render(<Header />);
    const mobileNav = container.querySelector('nav[aria-label="Mobile navigation"]');
    expect(mobileNav).toBeNull();
  });

  it('should show mobile menu after clicking hamburger button', () => {
    const { container } = render(<Header />);
    const menuBtn = container.querySelector('button[aria-label="Toggle menu"]')!;
    fireEvent.click(menuBtn);
    const mobileNav = container.querySelector('nav[aria-label="Mobile navigation"]');
    expect(mobileNav).toBeTruthy();
  });

  it('should set aria-expanded="true" when mobile menu is open', () => {
    const { container } = render(<Header />);
    const menuBtn = container.querySelector('button[aria-label="Toggle menu"]')!;
    fireEvent.click(menuBtn);
    expect(menuBtn.getAttribute('aria-expanded')).toBe('true');
  });

  it('should close mobile menu when hamburger is clicked again', () => {
    const { container } = render(<Header />);
    const menuBtn = container.querySelector('button[aria-label="Toggle menu"]')!;
    fireEvent.click(menuBtn);
    expect(container.querySelector('nav[aria-label="Mobile navigation"]')).toBeTruthy();
    fireEvent.click(menuBtn);
    expect(container.querySelector('nav[aria-label="Mobile navigation"]')).toBeNull();
  });

  it('should render nav links in mobile menu when open', () => {
    const { container } = render(<Header />);
    const menuBtn = container.querySelector('button[aria-label="Toggle menu"]')!;
    fireEvent.click(menuBtn);
    const mobileNav = container.querySelector('nav[aria-label="Mobile navigation"]')!;
    const links = mobileNav.querySelectorAll('a');
    const hrefs = Array.from(links).map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/deals');
    expect(hrefs).toContain('/free-games');
    expect(hrefs).toContain('/stores');
  });

  it('should render a search input in the mobile menu', () => {
    const { container } = render(<Header />);
    const menuBtn = container.querySelector('button[aria-label="Toggle menu"]')!;
    fireEvent.click(menuBtn);
    const mobileNav = container.querySelector('nav[aria-label="Mobile navigation"]')!;
    const searchInput = mobileNav.querySelector('input[type="search"]');
    expect(searchInput).toBeTruthy();
  });

  it('should close mobile menu when a nav link is clicked', () => {
    const { container } = render(<Header />);
    const menuBtn = container.querySelector('button[aria-label="Toggle menu"]')!;
    fireEvent.click(menuBtn);
    const mobileNav = container.querySelector('nav[aria-label="Mobile navigation"]')!;
    const firstLink = mobileNav.querySelector('a')!;
    fireEvent.click(firstLink);
    expect(container.querySelector('nav[aria-label="Mobile navigation"]')).toBeNull();
  });

  it('should render a Sign In link in the mobile menu when unauthenticated', () => {
    const { container } = render(<Header />);
    const menuBtn = container.querySelector('button[aria-label="Toggle menu"]')!;
    fireEvent.click(menuBtn);
    const mobileNav = container.querySelector('nav[aria-label="Mobile navigation"]')!;
    const signInLink = mobileNav.querySelector('a[href="/login"]');
    expect(signInLink).toBeTruthy();
    expect(signInLink?.textContent).toBe('Sign In');
  });

  it('should have focus-visible styles on interactive elements', () => {
    const { container } = render(<Header />);
    const links = container.querySelectorAll('a');
    for (const link of Array.from(links)) {
      expect(link.className).toContain('focus-visible:outline');
    }
  });

  // Authenticated state tests
  describe('when authenticated', () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        logout: mockLogout,
      });
    });

    it('should show user name instead of Sign In', () => {
      const { container } = render(<Header />);
      expect(container.textContent).toContain('Test User');
      const links = container.querySelectorAll('a[href="/login"]');
      // Desktop Sign In link should not be present
      const desktopAuthArea = container.querySelector('.hidden.md\\:block');
      expect(desktopAuthArea?.querySelector('a[href="/login"]')).toBeNull();
    });

    it('should render a Sign Out button', () => {
      const { container } = render(<Header />);
      const buttons = container.querySelectorAll('button');
      const signOutBtn = Array.from(buttons).find((b) => b.textContent === 'Sign Out');
      expect(signOutBtn).toBeTruthy();
    });

    it('should call logout and redirect to / when Sign Out is clicked', async () => {
      const { container } = render(<Header />);
      const buttons = container.querySelectorAll('button');
      const signOutBtn = Array.from(buttons).find((b) => b.textContent === 'Sign Out')!;
      fireEvent.click(signOutBtn);
      await vi.waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should show Sign Out button in mobile menu', () => {
      const { container } = render(<Header />);
      const menuBtn = container.querySelector('button[aria-label="Toggle menu"]')!;
      fireEvent.click(menuBtn);
      const mobileNav = container.querySelector('nav[aria-label="Mobile navigation"]')!;
      const buttons = mobileNav.querySelectorAll('button');
      const signOutBtn = Array.from(buttons).find((b) => b.textContent === 'Sign Out');
      expect(signOutBtn).toBeTruthy();
    });

    it('should call logout and redirect when mobile Sign Out is clicked', async () => {
      const { container } = render(<Header />);
      const menuBtn = container.querySelector('button[aria-label="Toggle menu"]')!;
      fireEvent.click(menuBtn);
      const mobileNav = container.querySelector('nav[aria-label="Mobile navigation"]')!;
      const buttons = mobileNav.querySelectorAll('button');
      const signOutBtn = Array.from(buttons).find((b) => b.textContent === 'Sign Out')!;
      fireEvent.click(signOutBtn);
      await vi.waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should not show Sign In link in mobile menu when authenticated', () => {
      const { container } = render(<Header />);
      const menuBtn = container.querySelector('button[aria-label="Toggle menu"]')!;
      fireEvent.click(menuBtn);
      const mobileNav = container.querySelector('nav[aria-label="Mobile navigation"]')!;
      expect(mobileNav.querySelector('a[href="/login"]')).toBeNull();
    });

    it('should display user email when name is not available', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
        logout: mockLogout,
      });
      const { container } = render(<Header />);
      expect(container.textContent).toContain('test@example.com');
    });
  });
});
