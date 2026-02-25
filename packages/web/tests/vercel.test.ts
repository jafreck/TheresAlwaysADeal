import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vercelJson = JSON.parse(
  readFileSync(resolve(__dirname, '../vercel.json'), 'utf-8'),
) as Record<string, unknown>;

describe('vercel.json', () => {
  it('should be valid JSON', () => {
    expect(vercelJson).toBeDefined();
    expect(typeof vercelJson).toBe('object');
  });

  it('should set framework to nextjs', () => {
    expect(vercelJson.framework).toBe('nextjs');
  });

  it('should document the NEXT_PUBLIC_API_URL env key', () => {
    const env = vercelJson.env as Record<string, unknown> | undefined;
    expect(env).toBeDefined();
    expect('NEXT_PUBLIC_API_URL' in (env ?? {})).toBe(true);
  });
});
