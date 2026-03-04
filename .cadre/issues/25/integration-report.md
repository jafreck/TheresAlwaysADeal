# Integration Report: Issue #25

## Install

**Command:** `npm install`
**Exit Code:** 1
**Status:** fail

```
npm error Cannot read properties of null (reading 'matches')
npm error A complete log of this run can be found in: /Users/jacobfreck/.npm/_logs/2026-03-04T01_58_56_344Z-debug-0.log

```

## Build

**Command:** `npm run build`
**Exit Code:** 0
**Status:** pass

## Test

**Command:** `npx vitest run`
**Exit Code:** 0
**Status:** pass

## Lint

**Command:** `npm run lint`
**Exit Code:** 1
**Status:** fail

```
• turbo 2.8.10
@taad/db:lint: ERROR: command finished with error: command (/Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/db) /opt/homebrew/bin/pnpm run lint exited (1)
@taad/db#lint: command (/Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/db) /opt/homebrew/bin/pnpm run lint exited (1)
 ERROR  run failed: command  exited (1)


> theres-always-a-deal@0.0.1 lint
> turbo run lint

• Packages in scope: @taad/api, @taad/db, @taad/scraper, @taad/web, @taad/worker
• Running lint in 5 packages
• Remote caching disabled, using shared worktree cache
@taad/db:lint: cache miss, executing a8170f71b3a1b0f5
@taad/db:build: cache hit, replaying logs e2efb2f232598317
@taad/db:build: 
@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/db
@taad/db:build: > tsc -p tsconfig.json
@taad/db:build: 
@taad/api:lint: cache miss, executing 84e53f50c710b662
@taad/scraper:lint: cache miss, executing ac3dae205c91217d
@taad/web:lint: cache miss, executing 760d501449a13d71
@taad/scraper:build: cache hit, replaying logs a3c88866539013d7
@taad/scraper:build: 
@taad/scraper:build: > @taad/scraper@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-17/packages/scraper
@taad/scraper:build: > tsc -p tsconfig.json
@taad/scraper:build: 
@taad/worker:lint: cache miss, executing 56a88a129c5af295
@taad/web:lint: 
@taad/web:lint: > @taad/web@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/web
@taad/web:lint: > eslint . --max-warnings 0
@taad/web:lint: 
@taad/scraper:lint: 
@taad/scraper:lint: > @taad/scraper@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/scraper
@taad/scraper:lint: > eslint . --max-warnings 0
@taad/scraper:lint: 
@taad/api:lint: 
@taad/api:lint: > @taad/api@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/api
@taad/api:lint: > eslint . --max-warnings 0
@taad/api:lint: 
@taad/db:lint: 
@taad/db:lint: > @taad/db@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/db
@taad/db:lint: > eslint . --max-warnings 0
@taad/db:lint: 
@taad/worker:lint: 
@taad/worker:lint: > @taad/worker@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/worker
@taad/worker:lint: > eslint . --max-warnings 0
@taad/worker:lint: 
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/db/drizzle.config.ts
@taad/db:lint:   8:10  error  'process' is not defined  no-undef
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/db/src/index.ts
@taad/db:lint:   5:6   error  'process' is not defined  no-undef
@taad/db:lint:   9:18  error  'process' is not defined  no-undef
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/db/src/seed.ts
@taad/db:lint:     5:6   error  'process' is not defined  no-undef
@taad/db:lint:     9:25  error  'process' is not defined  no-undef
@taad/db:lint:   170:3   error  'console' is not defined  no-undef
@taad/db:lint:   175:5   error  'console' is not defined  no-undef
@taad/db:lint:   176:5   error  'process' is not defined  no-undef
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/db/tests/schema.test.ts
@taad/db:lint:   315:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint:   320:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint:   325:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint:   330:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint:   353:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/db/tests/seed.test.ts
@taad/db:lint:    69:23  error  'process' is not defined  no-undef
@taad/db:lint:    86:14  error  'process' is not defined  no-undef
@taad/db:lint:    88:7   error  'process' is not defined  no-undef
@taad/db:lint:    94:14  error  'process' is not defined  no-undef
@taad/db:lint:   101:7   error  'process' is not defined  no-undef
@taad/db:lint:   110:7   error  'process' is not defined  no-undef
@taad/db:lint:   122:16  error  'console' is not defined  no-undef
@taad/db:lint:   291:16  error  'console' is not defined  no-undef
@taad/db:lint:   294:16  error  'process' is not defined  no-undef
@taad/db:lint: 
@taad/db:lint: ✖ 22 problems (22 errors, 0 warnings)
@taad/db:lint: 
@taad/db:lint:  ELIFECYCLE  Command failed with exit code 1.

 Tasks:    2 successful, 7 total
Cached:    2 cached, 7 total
  Time:    5.265s 
Failed:    @taad/db#lint


```

## Pre-existing Failures

_None_

## New Regressions

_None_

```cadre-json
{"buildResult":{"command":"npm run build","exitCode":0,"signal":null,"output":"• turbo 2.8.10\n\n> theres-always-a-deal@0.0.1 build\n> turbo run build\n\n• Packages in scope: @taad/api, @taad/db, @taad/scraper, @taad/web, @taad/worker\n• Running build in 5 packages\n• Remote caching disabled, using shared worktree cache\n@taad/db:build: cache hit, replaying logs e2efb2f232598317\n@taad/db:build: \n@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/db\n@taad/db:build: > tsc -p tsconfig.json\n@taad/db:build: \n@ta","pass":true},"testResult":{"command":"npx vitest run","exitCode":0,"signal":null,"output":"\u001b[33mThe CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.\u001b[39m\nstderr | packages/api/tests/index.test.ts > POST /api/v1/auth/register > returns a non-404 response confirming auth routes are mounted\nSyntaxError: Unexpected end of JSON input\n    at JSON.parse (<anonymous>)\n    at file:///Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/node_modules/.pnpm/hono@4.12.2/node_modules/ho","pass":true},"lintResult":{"command":"npm run lint","exitCode":1,"signal":null,"output":"\n> theres-always-a-deal@0.0.1 lint\n> turbo run lint\n\n• Packages in scope: @taad/api, @taad/db, @taad/scraper, @taad/web, @taad/worker\n• Running lint in 5 packages\n• Remote caching disabled, using shared worktree cache\n@taad/db:lint: cache miss, executing a8170f71b3a1b0f5\n@taad/db:build: cache hit, replaying logs e2efb2f232598317\n@taad/db:build: \n@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-25/packages/db\n@taad/db:build: > tsc -","pass":false},"overallPass":true,"regressionFailures":[],"baselineFailures":[]}
```
