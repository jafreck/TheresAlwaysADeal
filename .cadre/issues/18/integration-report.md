# Integration Report: Issue #18

## Install

**Command:** `npm install`
**Exit Code:** 1
**Status:** fail

```
npm error Cannot read properties of null (reading 'matches')
npm error A complete log of this run can be found in: /Users/jacobfreck/.npm/_logs/2026-03-03T22_08_59_310Z-debug-0.log

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
@taad/db:lint: ERROR: command finished with error: command (/Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/db) /opt/homebrew/bin/pnpm run lint exited (1)
@taad/db#lint: command (/Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/db) /opt/homebrew/bin/pnpm run lint exited (1)
 ERROR  run failed: command  exited (1)


> theres-always-a-deal@0.0.1 lint
> turbo run lint

• Packages in scope: @taad/api, @taad/db, @taad/scraper, @taad/web, @taad/worker
• Running lint in 5 packages
• Remote caching disabled, using shared worktree cache
@taad/db:lint: cache miss, executing dcf10248e32f0015
@taad/db:build: cache hit, replaying logs 41b8bf81833ed669
@taad/db:build: 
@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/db
@taad/db:build: > tsc -p tsconfig.json
@taad/db:build: 
@taad/web:lint: cache miss, executing 826bf7658300d01c
@taad/scraper:lint: cache miss, executing 2869b3d678f323ef
@taad/api:lint: cache miss, executing a59dfcc7c491de3c
@taad/scraper:build: cache hit, replaying logs 375b30b30a93d8d0
@taad/scraper:build: 
@taad/scraper:build: > @taad/scraper@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/scraper
@taad/scraper:build: > tsc -p tsconfig.json
@taad/scraper:build: 
@taad/worker:lint: cache miss, executing ab5d6e9af42558a1
@taad/web:lint: 
@taad/web:lint: > @taad/web@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/web
@taad/web:lint: > eslint . --max-warnings 0
@taad/web:lint: 
@taad/db:lint: 
@taad/db:lint: > @taad/db@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/db
@taad/db:lint: > eslint . --max-warnings 0
@taad/db:lint: 
@taad/worker:lint: 
@taad/worker:lint: > @taad/worker@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/worker
@taad/worker:lint: > eslint . --max-warnings 0
@taad/worker:lint: 
@taad/api:lint: 
@taad/api:lint: > @taad/api@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/api
@taad/api:lint: > eslint . --max-warnings 0
@taad/api:lint: 
@taad/scraper:lint: 
@taad/scraper:lint: > @taad/scraper@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/scraper
@taad/scraper:lint: > eslint . --max-warnings 0
@taad/scraper:lint: 
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/db/drizzle.config.ts
@taad/db:lint:   8:10  error  'process' is not defined  no-undef
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/db/src/index.ts
@taad/db:lint:   5:6   error  'process' is not defined  no-undef
@taad/db:lint:   9:18  error  'process' is not defined  no-undef
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/db/src/seed.ts
@taad/db:lint:     5:6   error  'process' is not defined  no-undef
@taad/db:lint:     9:25  error  'process' is not defined  no-undef
@taad/db:lint:   170:3   error  'console' is not defined  no-undef
@taad/db:lint:   175:5   error  'console' is not defined  no-undef
@taad/db:lint:   176:5   error  'process' is not defined  no-undef
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/db/tests/schema.test.ts
@taad/db:lint:   315:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint:   320:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint:   325:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint:   330:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint:   353:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/db:lint: 
@taad/db:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/db/tests/seed.test.ts
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
@taad/scraper:lint: 
@taad/scraper:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/scraper/src/fanatical.ts
@taad/scraper:lint:    3:1   error  Imports "ScrapedGame" are only used as type  @typescript-eslint/consistent-type-imports
@taad/scraper:lint:   37:19  error  'process' is not defined                     no-undef
@taad/scraper:lint:   38:23  error  'process' is not defined                     no-undef
@taad/scraper:lint:   65:9   error  'fetch' is not defined                       no-undef
@taad/scraper:lint: 
@taad/scraper:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/scraper/src/referral.ts
@taad/scraper:lint:   20:15  error  'process' is not defined  no-undef
@taad/scraper:lint:   23:19  error  'URL' is not defined      no-undef
@taad/scraper:lint: 
@taad/scraper:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/scraper/src/steam.ts
@taad/scraper:lint:    73:9   error  'fetch' is not defined  no-undef
@taad/scraper:lint:    91:9   error  'fetch' is not defined  no-undef
@taad/scraper:lint:   121:11  error  'fetch' is not defined  no-undef
@taad/scraper:lint: 
@taad/scraper:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/scraper/src/types.ts
@taad/scraper:lint:    1:1   error  All imports in the declaration are only used as types. Use `import type`  @typescript-eslint/consistent-type-imports
@taad/scraper:lint:    4:1   error  All imports in the declaration are only used as types. Use `import type`  @typescript-eslint/consistent-type-imports
@taad/scraper:lint:   18:35  error  'setTimeout' is not defined                                               no-undef
@taad/scraper:lint:   78:52  error  'Response' is not defined                                                 no-undef
@taad/scraper:lint:   78:72  error  'Response' is not defined                                                 no-undef
@taad/scraper:lint: 
@taad/scraper:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/scraper/tests/fanatical.test.ts
@taad/scraper:lint:    23:5   error  'process' is not defined      no-undef
@taad/scraper:lint:    24:5   error  'process' is not defined      no-undef
@taad/scraper:lint:    29:12  error  'process' is not defined      no-undef
@taad/scraper:lint:    30:12  error  'process' is not defined      no-undef
@taad/scraper:lint:    31:12  error  'process' is not defined      no-undef
@taad/scraper:lint:    37:14  error  'process' is not defined      no-undef
@taad/scraper:lint:    42:14  error  'process' is not defined      no-undef
@taad/scraper:lint:   142:7   error  'process' is not defined      no-undef
@taad/scraper:lint:   156:14  error  'process' is not defined      no-undef
@taad/scraper:lint:   203:73  error  'RequestInit' is not defined  no-undef
@taad/scraper:lint:   254:57  error  'RequestInit' is not defined  no-undef
@taad/scraper:lint: 
@taad/scraper:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/scraper/tests/index.test.ts
@taad/scraper:lint:   18:23  error  'IScraper' is defined but never used  @typescript-eslint/no-unused-vars
@taad/scraper:lint:   63:25  error  'process' is not defined              no-undef
@taad/scraper:lint:   64:12  error  'process' is not defined              no-undef
@taad/scraper:lint:   68:38  error  'process' is not defined              no-undef
@taad/scraper:lint: 
@taad/scraper:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/scraper/tests/referral.test.ts
@taad/scraper:lint:     1:32  error  'beforeEach' is defined but never used  @typescript-eslint/no-unused-vars
@taad/scraper:lint:     5:28  error  'process' is not defined                no-undef
@taad/scraper:lint:    11:9   error  'process' is not defined                no-undef
@taad/scraper:lint:    13:16  error  'process' is not defined                no-undef
@taad/scraper:lint:    20:7   error  'process' is not defined                no-undef
@taad/scraper:lint:    26:14  error  'process' is not defined                no-undef
@taad/scraper:lint:    34:7   error  'process' is not defined                no-undef
@taad/scraper:lint:    40:14  error  'process' is not defined                no-undef
@taad/scraper:lint:    48:7   error  'process' is not defined                no-undef
@taad/scraper:lint:    54:14  error  'process' is not defined                no-undef
@taad/scraper:lint:    62:7   error  'process' is not defined                no-undef
@taad/scraper:lint:    68:14  error  'process' is not defined                no-undef
@taad/scraper:lint:    76:7   error  'process' is not defined                no-undef
@taad/scraper:lint:    82:14  error  'process' is not defined                no-undef
@taad/scraper:lint:    88:7   error  'process' is not defined                no-undef
@taad/scraper:lint:    94:14  error  'process' is not defined                no-undef
@taad/scraper:lint:   102:7   error  'process' is not defined                no-undef
@taad/scraper:lint:   108:14  error  'process' is not defined                no-undef
@taad/scraper:lint: 
@taad/scraper:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/scraper/tests/schemas.test.ts
@taad/scraper:lint:   58:23  error  '_c' is assigned a value but never used  @typescript-eslint/no-unused-vars
@taad/scraper:lint: 
@taad/scraper:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/scraper/tests/steam.test.ts
@taad/scraper:lint:   66:37  error  'URL' is not defined       no-undef
@taad/scraper:lint:   66:43  error  'Request' is not defined   no-undef
@taad/scraper:lint:   74:14  error  'Response' is not defined  no-undef
@taad/scraper:lint:   77:66  error  'Response' is not defined  no-undef
@taad/scraper:lint: 
@taad/scraper:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/scraper/tests/types.test.ts
@taad/scraper:lint:    74:35  error  'Response' is not defined  no-undef
@taad/scraper:lint:    89:35  error  'Response' is not defined  no-undef
@taad/scraper:lint:   102:57  error  'Response' is not defined  no-undef
@taad/scraper:lint:   111:57  error  'Response' is not defined  no-undef
@taad/scraper:lint:   132:45  error  'Response' is not defined  no-undef
@taad/scraper:lint:   134:51  error  'Response' is not defined  no-undef
@taad/scraper:lint:   277:27  error  'process' is not defined   no-undef
@taad/scraper:lint:   278:7   error  'process' is not defined   no-undef
@taad/scraper:lint:   318:11  error  'process' is not defined   no-undef
@taad/scraper:lint:   320:18  error  'process' is not defined   no-undef
@taad/scraper:lint: 
@taad/scraper:lint: ✖ 62 problems (62 errors, 0 warnings)
@taad/scraper:lint:   3 errors and 0 warnings potentially fixable with the `--fix` option.
@taad/scraper:lint: 

 Tasks:    2 successful, 7 total
Cached:    2 cached, 7 total
  Time:    1.891s 
Failed:    @taad/db#lint


```

## Pre-existing Failures

_None_

## New Regressions

_None_

```cadre-json
{"buildResult":{"command":"npm run build","exitCode":0,"signal":null,"output":"• turbo 2.8.10\n\n> theres-always-a-deal@0.0.1 build\n> turbo run build\n\n• Packages in scope: @taad/api, @taad/db, @taad/scraper, @taad/web, @taad/worker\n• Running build in 5 packages\n• Remote caching disabled, using shared worktree cache\n@taad/db:build: cache hit, replaying logs 41b8bf81833ed669\n@taad/db:build: \n@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/db\n@taad/db:build: > tsc -p tsconfig.json\n@taad/db:build: \n@ta","pass":true},"testResult":{"command":"npx vitest run","exitCode":0,"signal":null,"output":"stderr | packages/api/tests/index.test.ts > POST /api/v1/auth/register > returns a non-404 response confirming auth routes are mounted\nSyntaxError: Unexpected end of JSON input\n    at JSON.parse (<anonymous>)\n    at file:///Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/node_modules/.pnpm/hono@4.12.2/node_modules/hono/dist/request.js:118:57\n    at processTicksAndRejections (node:internal/process/task_queues:104:5)\n    at /Users/jacobfreck/Source/cadre/.cadre/configs","pass":true},"lintResult":{"command":"npm run lint","exitCode":1,"signal":null,"output":"\n> theres-always-a-deal@0.0.1 lint\n> turbo run lint\n\n• Packages in scope: @taad/api, @taad/db, @taad/scraper, @taad/web, @taad/worker\n• Running lint in 5 packages\n• Remote caching disabled, using shared worktree cache\n@taad/db:lint: cache miss, executing dcf10248e32f0015\n@taad/db:build: cache hit, replaying logs 41b8bf81833ed669\n@taad/db:build: \n@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-18/packages/db\n@taad/db:build: > tsc -","pass":false},"overallPass":true,"regressionFailures":[],"baselineFailures":[]}
```
