import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workflowPath = resolve(__dirname, '../../../.github/workflows/deploy.yml');
const workflow = readFileSync(workflowPath, 'utf-8');
const lines = workflow.split('\n');

const dependabotPath = resolve(__dirname, '../../../.github/dependabot.yml');
const dependabot = readFileSync(dependabotPath, 'utf-8');

describe('.github/workflows/deploy.yml', () => {
  it('should trigger on push to main', () => {
    expect(workflow).toContain('push:');
    expect(workflow).toContain('- main');
  });

  it('should trigger on push to staging', () => {
    expect(workflow).toContain('- staging');
  });

  it('should define an audit job', () => {
    expect(workflow).toContain('audit:');
  });

  it('should run pnpm audit with high audit level in audit job', () => {
    expect(workflow).toContain('pnpm audit --audit-level=high');
  });

  it('should run audit job before build-and-push', () => {
    const auditIndex = lines.findIndex(l => l.includes('audit:'));
    const buildIndex = lines.findIndex(l => l.includes('build-and-push:'));
    expect(auditIndex).toBeLessThan(buildIndex);
    // build-and-push should declare audit as a dependency
    const buildNeeds = workflow.match(/build-and-push:[\s\S]*?needs:[\s\S]*?- audit/);
    expect(buildNeeds).not.toBeNull();
  });

  it('should define a build-and-push job', () => {
    expect(workflow).toContain('build-and-push:');
  });

  it('should define a migrate job', () => {
    expect(workflow).toContain('migrate:');
  });

  it('should define a deploy job', () => {
    expect(workflow).toContain('deploy:');
  });

  it('should define a notify job', () => {
    expect(workflow).toContain('notify:');
  });

  it('should log in to ghcr.io using docker/login-action', () => {
    expect(workflow).toContain('docker/login-action');
    expect(workflow).toContain('registry: ghcr.io');
  });

  it('should authenticate to GHCR using GITHUB_TOKEN', () => {
    expect(workflow).toContain('secrets.GITHUB_TOKEN');
  });

  it('should build and push taad-api image tagged with commit SHA', () => {
    expect(workflow).toContain('taad-api:${{ github.sha }}');
    expect(workflow).toContain('packages/api/Dockerfile');
  });

  it('should build and push taad-worker image tagged with commit SHA', () => {
    expect(workflow).toContain('taad-worker:${{ github.sha }}');
    expect(workflow).toContain('packages/worker/Dockerfile');
  });

  it('should push images with push: true', () => {
    expect(workflow).toContain('push: true');
  });

  it('should run DB migrations using pnpm --filter @taad/db db:migrate', () => {
    expect(workflow).toContain('pnpm --filter @taad/db db:migrate');
  });

  it('should run production migrations with DATABASE_URL when on main', () => {
    expect(workflow).toContain("github.ref_name == 'main'");
    expect(workflow).toContain('DATABASE_URL: ${{ secrets.DATABASE_URL }}');
  });

  it('should run staging migrations with STAGING_DATABASE_URL when on staging', () => {
    expect(workflow).toContain("github.ref_name == 'staging'");
    expect(workflow).toContain('secrets.STAGING_DATABASE_URL');
  });

  it('should install Railway CLI', () => {
    expect(workflow).toContain('@railway/cli');
  });

  it('should deploy to Railway using RAILWAY_API_TOKEN for production', () => {
    expect(workflow).toContain('secrets.RAILWAY_API_TOKEN');
  });

  it('should deploy to Railway using STAGING_RAILWAY_API_TOKEN for staging', () => {
    expect(workflow).toContain('secrets.STAGING_RAILWAY_API_TOKEN');
  });

  it('should send a Slack notification on failure', () => {
    expect(workflow).toContain('secrets.SLACK_WEBHOOK_URL');
  });

  it('should configure notify job to run only on failure', () => {
    expect(workflow).toContain('if: failure()');
  });

  it('should configure notify job to depend on all upstream jobs', () => {
    expect(workflow).toContain('- build-and-push');
    expect(workflow).toContain('- migrate');
    expect(workflow).toContain('- deploy');
  });

  it('should run all jobs on ubuntu-latest', () => {
    const ubuntuLines = lines.filter(l => l.includes('ubuntu-latest'));
    expect(ubuntuLines.length).toBeGreaterThanOrEqual(4);
  });

  it('should grant packages:write permission in build-and-push job', () => {
    expect(workflow).toContain('packages: write');
  });

  it('should install dependencies with frozen lockfile in migrate job', () => {
    expect(workflow).toContain('pnpm install --frozen-lockfile');
  });

  it('should use pnpm/action-setup in migrate job', () => {
    expect(workflow).toContain('pnpm/action-setup');
  });
});

describe('.github/dependabot.yml', () => {
  it('should use Dependabot version 2', () => {
    expect(dependabot).toContain('version: 2');
  });

  it('should configure npm ecosystem', () => {
    expect(dependabot).toContain('package-ecosystem: npm');
  });

  it('should target the root directory', () => {
    expect(dependabot).toContain('directory: /');
  });

  it('should schedule weekly updates', () => {
    expect(dependabot).toContain('interval: weekly');
  });

  it('should set an open pull requests limit', () => {
    expect(dependabot).toMatch(/open-pull-requests-limit:\s+\d+/);
  });
});
