# Integration Report: Issue #20

## Install

**Command:** `npm install`
**Exit Code:** 1
**Status:** fail

```
npm error Cannot read properties of null (reading 'matches')
npm error A complete log of this run can be found in: /Users/jacobfreck/.npm/_logs/2026-03-04T02_12_06_959Z-debug-0.log

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
@taad/crypto:lint: ERROR: command finished with error: command (/Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/crypto) /opt/homebrew/bin/pnpm run lint exited (1)
@taad/crypto#lint: command (/Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/crypto) /opt/homebrew/bin/pnpm run lint exited (1)
 ERROR  run failed: command  exited (1)


> theres-always-a-deal@0.0.1 lint
> turbo run lint

• Packages in scope: @taad/api, @taad/crypto, @taad/db, @taad/email, @taad/scraper, @taad/web, @taad/worker
• Running lint in 7 packages
• Remote caching disabled, using shared worktree cache
@taad/db:lint: cache miss, executing 0ee7a4d01d6232d8
@taad/crypto:lint: cache miss, executing b5952db46009f222
@taad/db:build: cache hit, replaying logs 669e7f4f189d1475
@taad/db:build: 
@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/db
@taad/db:build: > tsc -p tsconfig.json
@taad/db:build: 
@taad/crypto:build: cache hit, replaying logs 1c324a99065347d7
@taad/crypto:build: 
@taad/crypto:build: > @taad/crypto@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/crypto
@taad/crypto:build: > tsc -p tsconfig.json
@taad/crypto:build: 
@taad/email:lint: cache miss, executing 54cc878a75019f62
@taad/web:lint: cache miss, executing 8addbff80e5ec647
@taad/scraper:lint: cache miss, executing 9954270ce45615d3
@taad/email:build: cache hit, replaying logs f401c9d995226315
@taad/email:build: 
@taad/email:build: > @taad/email@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/email
@taad/email:build: > tsc -p tsconfig.json
@taad/email:build: 
@taad/api:lint: cache miss, executing 3bd72c7fdf934f2c
@taad/scraper:build: cache hit, replaying logs c51640b1b31397ee
@taad/scraper:build: 
@taad/scraper:build: > @taad/scraper@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/scraper
@taad/scraper:build: > tsc -p tsconfig.json
@taad/scraper:build: 
@taad/worker:lint: cache miss, executing 6542147e2cee5830
@taad/scraper:lint: 
@taad/scraper:lint: > @taad/scraper@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/scraper
@taad/scraper:lint: > eslint . --max-warnings 0
@taad/scraper:lint: 
@taad/crypto:lint: 
@taad/crypto:lint: > @taad/crypto@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/crypto
@taad/crypto:lint: > eslint . --max-warnings 0
@taad/crypto:lint: 
@taad/web:lint: 
@taad/web:lint: > @taad/web@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/web
@taad/web:lint: > eslint . --max-warnings 0
@taad/web:lint: 
@taad/api:lint: 
@taad/api:lint: > @taad/api@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/api
@taad/api:lint: > eslint . --max-warnings 0
@taad/api:lint: 
@taad/db:lint: 
@taad/db:lint: > @taad/db@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/db
@taad/db:lint: > eslint . --max-warnings 0
@taad/db:lint: 
@taad/worker:lint: 
@taad/worker:lint: > @taad/worker@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/worker
@taad/worker:lint: > eslint . --max-warnings 0
@taad/worker:lint: 
@taad/email:lint: 
@taad/email:lint: > @taad/email@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/email
@taad/email:lint: > eslint . --max-warnings 0
@taad/email:lint: 
@taad/crypto:lint: 
@taad/crypto:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/crypto/src/index.ts
@taad/crypto:lint:    4:19  error  'Buffer' is not defined  no-undef
@taad/crypto:lint:   22:29  error  'Buffer' is not defined  no-undef
@taad/crypto:lint:   22:54  error  'Buffer' is not defined  no-undef
@taad/crypto:lint:   26:5   error  'Buffer' is not defined  no-undef
@taad/crypto:lint: 
@taad/crypto:lint: ✖ 4 problems (4 errors, 0 warnings)
@taad/crypto:lint: 
@taad/crypto:lint:  ELIFECYCLE  Command failed with exit code 1.

 Tasks:    4 successful, 11 total
Cached:    4 cached, 11 total
  Time:    3.507s 
Failed:    @taad/crypto#lint


```

## Pre-existing Failures

_None_

## New Regressions

_None_

```cadre-json
{"buildResult":{"command":"npm run build","exitCode":0,"signal":null,"output":"• turbo 2.8.10\n\n> theres-always-a-deal@0.0.1 build\n> turbo run build\n\n• Packages in scope: @taad/api, @taad/crypto, @taad/db, @taad/email, @taad/scraper, @taad/web, @taad/worker\n• Running build in 7 packages\n• Remote caching disabled, using shared worktree cache\n@taad/crypto:build: cache hit, replaying logs 1c324a99065347d7\n@taad/crypto:build: \n@taad/crypto:build: > @taad/crypto@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/packages/crypto\n@taad/crypto","pass":true},"testResult":{"command":"npx vitest run","exitCode":0,"signal":null,"output":"\u001b[33mThe CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.\u001b[39m\nstderr | packages/api/tests/index.test.ts > POST /api/v1/auth/register > returns a non-404 response confirming auth routes are mounted\nSyntaxError: Unexpected end of JSON input\n    at JSON.parse (<anonymous>)\n    at file:///Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-20/node_modules/.pnpm/hono@4.12.2/node_modules/ho","pass":true},"lintResult":{"command":"npm run lint","exitCode":1,"signal":null,"output":"\n> theres-always-a-deal@0.0.1 lint\n> turbo run lint\n\n• Packages in scope: @taad/api, @taad/crypto, @taad/db, @taad/email, @taad/scraper, @taad/web, @taad/worker\n• Running lint in 7 packages\n• Remote caching disabled, using shared worktree cache\n@taad/db:lint: cache miss, executing 0ee7a4d01d6232d8\n@taad/crypto:lint: cache miss, executing b5952db46009f222\n@taad/db:build: cache hit, replaying logs 669e7f4f189d1475\n@taad/db:build: \n@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cad","pass":false},"overallPass":true,"regressionFailures":[],"baselineFailures":[]}
```
