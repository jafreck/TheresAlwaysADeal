# Integration Report: Issue #19

## Install

**Command:** `npm install`
**Exit Code:** 1
**Status:** fail

```
npm error Cannot read properties of null (reading 'matches')
npm error A complete log of this run can be found in: /Users/jacobfreck/.npm/_logs/2026-03-03T22_24_51_228Z-debug-0.log

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
@taad/web:lint: ERROR: command finished with error: command (/Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/web) /opt/homebrew/bin/pnpm run lint exited (1)
@taad/web#lint: command (/Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/web) /opt/homebrew/bin/pnpm run lint exited (1)
 ERROR  run failed: command  exited (1)


> theres-always-a-deal@0.0.1 lint
> turbo run lint

• Packages in scope: @taad/api, @taad/db, @taad/scraper, @taad/web, @taad/worker
• Running lint in 5 packages
• Remote caching disabled, using shared worktree cache
@taad/db:lint: cache miss, executing e3585f9caee7928e
@taad/db:build: cache hit, replaying logs 21229d40095bbcc5
@taad/db:build: 
@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/db
@taad/db:build: > tsc -p tsconfig.json
@taad/db:build: 
@taad/scraper:lint: cache miss, executing e81571b02aee051e
@taad/web:lint: cache miss, executing 7af852b77e1be0fd
@taad/api:lint: cache miss, executing 15e3bdb3fbfd511a
@taad/scraper:build: cache hit, replaying logs 3e01fd51aa2a86d8
@taad/scraper:build: 
@taad/scraper:build: > @taad/scraper@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/scraper
@taad/scraper:build: > tsc -p tsconfig.json
@taad/scraper:build: 
@taad/worker:lint: cache miss, executing cd071cc212fbbecf
@taad/web:lint: 
@taad/web:lint: > @taad/web@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/web
@taad/web:lint: > eslint . --max-warnings 0
@taad/web:lint: 
@taad/db:lint: 
@taad/db:lint: > @taad/db@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/db
@taad/db:lint: > eslint . --max-warnings 0
@taad/db:lint: 
@taad/api:lint: 
@taad/api:lint: > @taad/api@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/api
@taad/api:lint: > eslint . --max-warnings 0
@taad/api:lint: 
@taad/worker:lint: 
@taad/worker:lint: > @taad/worker@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/worker
@taad/worker:lint: > eslint . --max-warnings 0
@taad/worker:lint: 
@taad/scraper:lint: 
@taad/scraper:lint: > @taad/scraper@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/scraper
@taad/scraper:lint: > eslint . --max-warnings 0
@taad/scraper:lint: 
@taad/web:lint: 
@taad/web:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/web/next-env.d.ts
@taad/web:lint:   3:1  error  Do not use a triple slash reference for ./.next/types/routes.d.ts, use `import` style instead  @typescript-eslint/triple-slash-reference
@taad/web:lint: 
@taad/web:lint: ✖ 1 problem (1 error, 0 warnings)
@taad/web:lint: 
@taad/web:lint:  ELIFECYCLE  Command failed with exit code 1.
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/db/drizzle.config.ts
@taad/db:lint:   8:10  error  'process' is not defined  no-undef
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/db/src/encryption.ts
@taad/db:lint:    6:20  error  'Buffer' is not defined   no-undef
@taad/db:lint:    7:15  error  'process' is not defined  no-undef
@taad/db:lint:   13:10  error  'Buffer' is not defined   no-undef
@taad/db:lint:   20:21  error  'Buffer' is not defined   no-undef
@taad/db:lint:   31:14  error  'Buffer' is not defined   no-undef
@taad/db:lint:   32:19  error  'Buffer' is not defined   no-undef
@taad/db:lint:   33:22  error  'Buffer' is not defined   no-undef
@taad/db:lint:   36:21  error  'Buffer' is not defined   no-undef
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/db/src/index.ts
@taad/db:lint:   5:6   error  'process' is not defined  no-undef
@taad/db:lint:   9:18  error  'process' is not defined  no-undef
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/db/src/seed.ts
@taad/db:lint:     5:6   error  'process' is not defined  no-undef
@taad/db:lint:     9:25  error  'process' is not defined  no-undef
@taad/db:lint:   170:3   error  'console' is not defined  no-undef
@taad/db:lint:   175:5   error  'console' is not defined  no-undef
@taad/db:lint:   176:5   error  'process' is not defined  no-undef
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/db/tests/schema.test.ts
@taad/db:lint:   334:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint:   339:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint:   344:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint:   349:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint:   372:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/db/tests/seed.test.ts
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
@taad/db:lint: ✖ 30 problems (30 errors, 0 warnings)
@taad/db:lint: 

 Tasks:    2 successful, 7 total
Cached:    2 cached, 7 total
  Time:    1.283s 
Failed:    @taad/web#lint


```

## Pre-existing Failures

_None_

## New Regressions

_None_

```cadre-json
{"buildResult":{"command":"npm run build","exitCode":0,"signal":null,"output":"• turbo 2.8.10\n\n> theres-always-a-deal@0.0.1 build\n> turbo run build\n\n• Packages in scope: @taad/api, @taad/db, @taad/scraper, @taad/web, @taad/worker\n• Running build in 5 packages\n• Remote caching disabled, using shared worktree cache\n@taad/db:build: cache hit, replaying logs 21229d40095bbcc5\n@taad/db:build: \n@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/db\n@taad/db:build: > tsc -p tsconfig.json\n@taad/db:build: \n@ta","pass":true},"testResult":{"command":"npx vitest run","exitCode":0,"signal":null,"output":"stderr | packages/api/tests/index.test.ts > POST /api/v1/auth/register > returns a non-404 response confirming auth routes are mounted\nSyntaxError: Unexpected end of JSON input\n    at JSON.parse (<anonymous>)\n    at file:///Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/node_modules/.pnpm/hono@4.12.2/node_modules/hono/dist/request.js:118:57\n    at processTicksAndRejections (node:internal/process/task_queues:104:5)\n    at /Users/jacobfreck/Source/cadre/.cadre/configs","pass":true},"lintResult":{"command":"npm run lint","exitCode":1,"signal":null,"output":"\n> theres-always-a-deal@0.0.1 lint\n> turbo run lint\n\n• Packages in scope: @taad/api, @taad/db, @taad/scraper, @taad/web, @taad/worker\n• Running lint in 5 packages\n• Remote caching disabled, using shared worktree cache\n@taad/db:lint: cache miss, executing e3585f9caee7928e\n@taad/db:build: cache hit, replaying logs 21229d40095bbcc5\n@taad/db:build: \n@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-19/packages/db\n@taad/db:build: > tsc -","pass":false},"overallPass":true,"regressionFailures":[],"baselineFailures":[]}
```
