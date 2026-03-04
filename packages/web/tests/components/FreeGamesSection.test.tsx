import { describe, it, expect, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => ({
    type: 'img',
    props,
    key: null,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => ({
    type: 'a',
    props: { href, ...props, children },
    key: null,
  }),
}));

vi.mock('../../src/components/CountdownTimer', () => ({
  default: ({ expiresAt }: { expiresAt: string }) => ({
    type: 'CountdownTimer',
    props: { expiresAt },
    key: null,
  }),
}));

vi.mock('../../src/components/EmptyState', () => ({
  default: ({ message }: { message: string }) => ({
    type: 'EmptyState',
    props: { message },
    key: null,
  }),
}));

vi.mock('../../src/components/StoreIcon', () => ({
  default: (props: Record<string, unknown>) => ({
    type: 'StoreIcon',
    props,
    key: null,
  }),
}));

import FreeGamesSection from '../../src/components/FreeGamesSection';
import type { FreeGame } from '../../src/components/FreeGamesSection';

const makeGame = (overrides: Partial<FreeGame> = {}): FreeGame => ({
  gameTitle: 'Subnautica',
  gameSlug: 'subnautica',
  headerImageUrl: 'https://cdn.example.com/subnautica.jpg',
  storeName: 'Epic Games',
  storeLogoUrl: 'https://cdn.example.com/epic.png',
  storeUrl: 'https://store.epicgames.com/subnautica',
  saleEndsAt: '2026-04-01T00:00:00Z',
  expiresAt: null,
  ...overrides,
});

describe('FreeGamesSection', () => {
  it('should be a function (React component)', () => {
    expect(typeof FreeGamesSection).toBe('function');
  });

  it('should return a section element', () => {
    const element = FreeGamesSection({ games: [] });
    expect(element.type).toBe('section');
  });

  it('should render "Free Games" heading', () => {
    const element = FreeGamesSection({ games: [] });
    const header = element.props.children[0];
    const heading = header.props.children[0];
    expect(heading.type).toBe('h2');
    expect(heading.props.children).toBe('Free Games');
  });

  it('should render "View all" link to /free-games', () => {
    const element = FreeGamesSection({ games: [] });
    const header = element.props.children[0];
    const link = header.props.children[1];
    expect(link.props.href).toBe('/free-games');
    expect(link.props.children).toBe('View all');
  });

  it('should render EmptyState when games array is empty', () => {
    const element = FreeGamesSection({ games: [] });
    const body = element.props.children[1];
    expect(typeof body.type).toBe('function');
    expect(body.props.message).toBe('No free games available right now.');
  });

  it('should render game articles when games are provided', () => {
    const games = [makeGame(), makeGame({ gameSlug: 'gta-v', gameTitle: 'GTA V' })];
    const element = FreeGamesSection({ games });
    const body = element.props.children[1];
    expect(body.type).toBe('div');
    expect(body.props.children).toHaveLength(2);
  });

  it('should render each game as an article', () => {
    const element = FreeGamesSection({ games: [makeGame()] });
    const body = element.props.children[1];
    const article = body.props.children[0];
    expect(article.type).toBe('article');
  });

  it('should use gameSlug-storeName as key for each game', () => {
    const games = [
      makeGame({ gameSlug: 'subnautica', storeName: 'Epic Games' }),
      makeGame({ gameSlug: 'subnautica', storeName: 'Steam' }),
    ];
    const element = FreeGamesSection({ games });
    const body = element.props.children[1];
    const articles = body.props.children;
    expect(articles[0].key).toBe('subnautica-Epic Games');
    expect(articles[1].key).toBe('subnautica-Steam');
  });

  it('should render a FREE badge', () => {
    const element = FreeGamesSection({ games: [makeGame()] });
    const body = element.props.children[1];
    const article = body.props.children[0];
    const imageContainer = article.props.children[0];
    const children = imageContainer.props.children;
    // children is [Image, FREE badge]
    const badge = Array.isArray(children) ? children[1] : null;
    expect(badge).toBeTruthy();
    expect(badge.props.children).toBe('FREE');
  });

  it('should render game title', () => {
    const element = FreeGamesSection({ games: [makeGame()] });
    const body = element.props.children[1];
    const article = body.props.children[0];
    const content = article.props.children[1];
    const title = content.props.children[0];
    expect(title.type).toBe('h3');
    expect(title.props.children).toBe('Subnautica');
  });

  it('should render StoreIcon with store info', () => {
    const game = makeGame();
    const element = FreeGamesSection({ games: [game] });
    const body = element.props.children[1];
    const article = body.props.children[0];
    const content = article.props.children[1];
    const storeRow = content.props.children[1];
    const storeIcon = storeRow.props.children[0];
    expect(typeof storeIcon.type).toBe('function');
    expect(storeIcon.props.storeName).toBe('Epic Games');
  });

  it('should render CountdownTimer when saleEndsAt is provided', () => {
    const game = makeGame({ saleEndsAt: '2026-04-01T00:00:00Z', expiresAt: null });
    const element = FreeGamesSection({ games: [game] });
    const body = element.props.children[1];
    const article = body.props.children[0];
    const content = article.props.children[1];
    const expiryRow = content.props.children[2];
    expect(expiryRow).toBeTruthy();
    // children: ["Ends in:", " ", <CountdownTimer />]
    const children = expiryRow.props.children;
    const countdown = Array.isArray(children) ? children[children.length - 1] : children;
    expect(typeof countdown.type).toBe('function');
    expect(countdown.props.expiresAt).toBe('2026-04-01T00:00:00Z');
  });

  it('should render CountdownTimer when expiresAt is provided but saleEndsAt is null', () => {
    const game = makeGame({ saleEndsAt: null, expiresAt: '2026-05-01T00:00:00Z' });
    const element = FreeGamesSection({ games: [game] });
    const body = element.props.children[1];
    const article = body.props.children[0];
    const content = article.props.children[1];
    const expiryRow = content.props.children[2];
    expect(expiryRow).toBeTruthy();
    const children = expiryRow.props.children;
    const countdown = Array.isArray(children) ? children[children.length - 1] : children;
    expect(countdown.props.expiresAt).toBe('2026-05-01T00:00:00Z');
  });

  it('should not render expiry row when both saleEndsAt and expiresAt are null', () => {
    const game = makeGame({ saleEndsAt: null, expiresAt: null });
    const element = FreeGamesSection({ games: [game] });
    const body = element.props.children[1];
    const article = body.props.children[0];
    const content = article.props.children[1];
    const expiryRow = content.props.children[2];
    expect(expiryRow).toBeFalsy();
  });

  it('should render a CTA link with correct aria-label', () => {
    const game = makeGame();
    const element = FreeGamesSection({ games: [game] });
    const body = element.props.children[1];
    const article = body.props.children[0];
    const content = article.props.children[1];
    const cta = content.props.children[3];
    expect(cta.type).toBe('a');
    expect(cta.props.href).toBe('https://store.epicgames.com/subnautica');
    expect(cta.props['aria-label']).toBe('Get Subnautica free on Epic Games');
    expect(cta.props.target).toBe('_blank');
    expect(cta.props.rel).toBe('noopener noreferrer');
  });

  it('should apply snap-scroll classes to the container', () => {
    const element = FreeGamesSection({ games: [makeGame()] });
    const body = element.props.children[1];
    expect(body.props.className).toContain('snap-x');
    expect(body.props.className).toContain('snap-mandatory');
    expect(body.props.className).toContain('overflow-x-auto');
  });

  it('should handle null storeLogoUrl', () => {
    const game = makeGame({ storeLogoUrl: null });
    const element = FreeGamesSection({ games: [game] });
    expect(element.type).toBe('section');
  });
});
