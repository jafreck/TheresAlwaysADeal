# Integration Report: Issue #21

## Install

**Command:** `npm install`
**Exit Code:** 1
**Status:** fail

```
npm error Cannot read properties of null (reading 'matches')
npm error A complete log of this run can be found in: /Users/jacobfreck/.npm/_logs/2026-03-04T01_59_09_372Z-debug-0.log

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
@taad/api:lint: ERROR: command finished with error: command (/Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api) /opt/homebrew/bin/pnpm run lint exited (1)
@taad/api#lint: command (/Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api) /opt/homebrew/bin/pnpm run lint exited (1)
 ERROR  run failed: command  exited (1)


> theres-always-a-deal@0.0.1 lint
> turbo run lint

• Packages in scope: @taad/api, @taad/db, @taad/scraper, @taad/web, @taad/worker
• Running lint in 5 packages
• Remote caching disabled, using shared worktree cache
@taad/db:lint: cache miss, executing d7bd77830f061441
@taad/db:build: cache hit, replaying logs 8d71d6c60edb1f02
@taad/db:build: 
@taad/db:build: 
@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/db
@taad/db:build: > tsc -p tsconfig.json
@taad/db:build: 
@taad/scraper:lint: cache miss, executing 40250e4c0a31a28f
@taad/web:lint: cache miss, executing 7deae5fed4b276a9
@taad/api:lint: cache miss, executing a4d34bc04f33794f
@taad/scraper:build: cache hit, replaying logs afed7dcdd137e3f4
@taad/scraper:build: 
@taad/scraper:build: 
@taad/scraper:build: > @taad/scraper@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/scraper
@taad/scraper:build: > tsc -p tsconfig.json
@taad/scraper:build: 
@taad/worker:lint: cache miss, executing 55ccbe9a8973a758
@taad/web:lint: 
@taad/web:lint: > @taad/web@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/web
@taad/web:lint: > eslint . --max-warnings 0
@taad/web:lint: 
@taad/api:lint: 
@taad/api:lint: > @taad/api@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api
@taad/api:lint: > eslint . --max-warnings 0
@taad/api:lint: 
@taad/scraper:lint: 
@taad/scraper:lint: > @taad/scraper@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/scraper
@taad/scraper:lint: > eslint . --max-warnings 0
@taad/scraper:lint: 
@taad/worker:lint: 
@taad/worker:lint: > @taad/worker@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/worker
@taad/worker:lint: > eslint . --max-warnings 0
@taad/worker:lint: 
@taad/db:lint: 
@taad/db:lint: > @taad/db@0.0.1 lint /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/db
@taad/db:lint: > eslint . --max-warnings 0
@taad/db:lint: 
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/src/index.ts
@taad/api:lint:   25:13  error  'process' is not defined  no-undef
@taad/api:lint:   33:8   error  'process' is not defined  no-undef
@taad/api:lint:   34:35  error  'process' is not defined  no-undef
@taad/api:lint:   82:21  error  'process' is not defined  no-undef
@taad/api:lint:   84:1   error  'console' is not defined  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/src/lib/email.ts
@taad/api:lint:   10:18  error  'process' is not defined  no-undef
@taad/api:lint:   11:3   error  'console' is not defined  no-undef
@taad/api:lint:   18:18  error  'process' is not defined  no-undef
@taad/api:lint:   19:3   error  'console' is not defined  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/src/lib/encryption.ts
@taad/api:lint:    7:20  error  'Buffer' is not defined   no-undef
@taad/api:lint:    8:15  error  'process' is not defined  no-undef
@taad/api:lint:   12:15  error  'Buffer' is not defined   no-undef
@taad/api:lint:   27:21  error  'Buffer' is not defined   no-undef
@taad/api:lint:   29:10  error  'Buffer' is not defined   no-undef
@taad/api:lint:   37:16  error  'Buffer' is not defined   no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/src/lib/jwt.ts
@taad/api:lint:    7:18  error  'process' is not defined  no-undef
@taad/api:lint:   13:18  error  'process' is not defined  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/src/lib/slack.ts
@taad/api:lint:   61:28  error  'fetch' is not defined  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/src/middleware/cache.ts
@taad/api:lint:   20:21  error  'URL' is not defined              no-undef
@taad/api:lint:   21:30  error  'URLSearchParams' is not defined  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/src/routes/auth.ts
@taad/api:lint:   38:13  error  'process' is not defined  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/src/routes/steam.ts
@taad/api:lint:   19:19  error  'process' is not defined          no-undef
@taad/api:lint:   21:7   error  'process' is not defined          no-undef
@taad/api:lint:   24:24  error  'URLSearchParams' is not defined  no-undef
@taad/api:lint:   51:30  error  'URLSearchParams' is not defined  no-undef
@taad/api:lint:   57:29  error  'fetch' is not defined            no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/src/routes/user.ts
@taad/api:lint:   64:25  error  'fetch' is not defined  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/env-example.test.ts
@taad/api:lint:   5:29  error  '__dirname' is not defined  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/index.test.ts
@taad/api:lint:    7:24  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   11:19  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   13:18  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   20:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   20:33  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   20:50  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   20:58  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   78:1   error  'process' is not defined                  no-undef
@taad/api:lint:   79:1   error  'process' is not defined                  no-undef
@taad/api:lint:   80:1   error  'process' is not defined                  no-undef
@taad/api:lint:   81:1   error  'process' is not defined                  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/infrastructure.test.ts
@taad/api:lint:   6:8  error  '__dirname' is not defined  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/lib/email.test.ts
@taad/api:lint:    6:14  error  'console' is not defined  no-undef
@taad/api:lint:   11:12  error  'process' is not defined  no-undef
@taad/api:lint:   16:12  error  'console' is not defined  no-undef
@taad/api:lint:   23:12  error  'console' is not defined  no-undef
@taad/api:lint:   30:12  error  'console' is not defined  no-undef
@taad/api:lint:   36:5   error  'process' is not defined  no-undef
@taad/api:lint:   38:12  error  'console' is not defined  no-undef
@taad/api:lint:   50:14  error  'console' is not defined  no-undef
@taad/api:lint:   55:12  error  'process' is not defined  no-undef
@taad/api:lint:   60:12  error  'console' is not defined  no-undef
@taad/api:lint:   67:12  error  'console' is not defined  no-undef
@taad/api:lint:   74:12  error  'console' is not defined  no-undef
@taad/api:lint:   80:5   error  'process' is not defined  no-undef
@taad/api:lint:   82:12  error  'console' is not defined  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/lib/encryption.test.ts
@taad/api:lint:     8:23  error  `import()` type annotations are forbidden  @typescript-eslint/consistent-type-imports
@taad/api:lint:    11:5   error  'process' is not defined                   no-undef
@taad/api:lint:    18:12  error  'process' is not defined                   no-undef
@taad/api:lint:    39:12  error  'process' is not defined                   no-undef
@taad/api:lint:    46:5   error  'process' is not defined                   no-undef
@taad/api:lint:    53:23  error  `import()` type annotations are forbidden  @typescript-eslint/consistent-type-imports
@taad/api:lint:    54:23  error  `import()` type annotations are forbidden  @typescript-eslint/consistent-type-imports
@taad/api:lint:    57:5   error  'process' is not defined                   no-undef
@taad/api:lint:    64:12  error  'process' is not defined                   no-undef
@taad/api:lint:   105:12  error  'process' is not defined                   no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/lib/jwt.test.ts
@taad/api:lint:    5:3   error  'process' is not defined  no-undef
@taad/api:lint:    6:3   error  'process' is not defined  no-undef
@taad/api:lint:   10:10  error  'process' is not defined  no-undef
@taad/api:lint:   11:10  error  'process' is not defined  no-undef
@taad/api:lint:   80:12  error  'process' is not defined  no-undef
@taad/api:lint:   87:12  error  'process' is not defined  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/lib/slack.test.ts
@taad/api:lint:   101:55  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/lib/validation.test.ts
@taad/api:lint:   492:34  error  '_' is assigned a value but never used  @typescript-eslint/no-unused-vars
@taad/api:lint:   497:27  error  '_' is assigned a value but never used  @typescript-eslint/no-unused-vars
@taad/api:lint:   502:36  error  '_' is assigned a value but never used  @typescript-eslint/no-unused-vars
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/middleware/cache.test.ts
@taad/api:lint:    5:52  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   10:8   error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/middleware/rate-limit.test.ts
@taad/api:lint:   20:8  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/openapi.test.ts
@taad/api:lint:   134:44  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   178:42  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   190:45  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   212:36  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   224:40  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   249:42  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/routes/auth.test.ts
@taad/api:lint:   29:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   30:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   31:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   34:18  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   38:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   38:33  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   38:50  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   38:58  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   90:8   error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   93:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   97:27  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   97:53  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   97:64  error  'RequestInit' is not defined              no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/routes/deals.test.ts
@taad/api:lint:     5:19  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:     7:18  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    14:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    14:33  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    14:50  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    14:58  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    37:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    77:22  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    84:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    84:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    84:54  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    84:62  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   108:22  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   115:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   115:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   115:54  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   115:62  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   298:22  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   305:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   305:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   305:54  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   305:62  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   379:22  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   386:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   386:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   386:54  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   386:62  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/routes/games.test.ts
@taad/api:lint:     5:19  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:     7:18  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    14:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    14:33  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    14:50  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    14:58  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    38:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    86:22  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    92:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    92:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    92:54  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    92:62  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   220:22  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   226:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   226:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   226:54  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   226:62  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   419:19  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   423:22  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   430:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   430:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   430:54  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   430:62  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   484:22  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   491:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   491:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   491:54  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   491:62  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   522:22  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   529:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   529:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   529:54  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   529:62  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/routes/steam.test.ts
@taad/api:lint:    10:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    11:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    14:18  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    18:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    18:33  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    18:50  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    18:58  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   138:24  error  'URLSearchParams' is not defined          no-undef
@taad/api:lint:   161:24  error  'URLSearchParams' is not defined          no-undef
@taad/api:lint:   185:24  error  'URLSearchParams' is not defined          no-undef
@taad/api:lint:   209:24  error  'URLSearchParams' is not defined          no-undef
@taad/api:lint:   222:22  error  'URLSearchParams' is not defined          no-undef
@taad/api:lint:   236:23  error  'process' is not defined                  no-undef
@taad/api:lint:   237:24  error  'process' is not defined                  no-undef
@taad/api:lint:   238:5   error  'process' is not defined                  no-undef
@taad/api:lint:   239:5   error  'process' is not defined                  no-undef
@taad/api:lint:   252:41  error  'process' is not defined                  no-undef
@taad/api:lint:   253:10  error  'process' is not defined                  no-undef
@taad/api:lint:   254:42  error  'process' is not defined                  no-undef
@taad/api:lint:   255:10  error  'process' is not defined                  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/routes/stores.test.ts
@taad/api:lint:    5:19  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    7:18  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   14:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   14:33  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   14:50  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   14:58  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/routes/user-alerts.test.ts
@taad/api:lint:   54:14  error  'Request' is not defined  no-undef
@taad/api:lint:   78:21  error  'Request' is not defined  no-undef
@taad/api:lint: 
@taad/api:lint: /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/api/tests/routes/user.test.ts
@taad/api:lint:    10:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    11:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    12:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    13:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    16:18  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    20:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    20:33  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    20:50  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    20:58  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    83:27  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    83:53  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:    83:64  error  'RequestInit' is not defined              no-undef
@taad/api:lint:   223:22  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   227:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   227:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   227:54  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   227:62  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   301:22  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   305:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   305:37  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   305:54  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint:   305:62  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
@taad/api:lint: 
@taad/api:lint: ✖ 206 problems (206 errors, 0 warnings)
@taad/api:lint: 
@taad/api:lint:  ELIFECYCLE  Command failed with exit code 1.

 Tasks:    2 successful, 7 total
Cached:    2 cached, 7 total
  Time:    3.327s 
Failed:    @taad/api#lint


```

## Pre-existing Failures

_None_

## New Regressions

_None_

```cadre-json
{"buildResult":{"command":"npm run build","exitCode":0,"signal":null,"output":"• turbo 2.8.10\n\n> theres-always-a-deal@0.0.1 build\n> turbo run build\n\n• Packages in scope: @taad/api, @taad/db, @taad/scraper, @taad/web, @taad/worker\n• Running build in 5 packages\n• Remote caching disabled, using shared worktree cache\n@taad/db:build: cache hit, replaying logs 8d71d6c60edb1f02\n@taad/db:build: \r\n@taad/db:build: \u0004\r\n@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/db\r\n@taad/db:build: > tsc -p tsconfig.json","pass":true},"testResult":{"command":"npx vitest run","exitCode":0,"signal":null,"output":"\u001b[33mThe CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.\u001b[39m\nstderr | packages/api/tests/index.test.ts > POST /api/v1/auth/register > returns a non-404 response confirming auth routes are mounted\nSyntaxError: Unexpected end of JSON input\n    at JSON.parse (<anonymous>)\n    at file:///Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/node_modules/.pnpm/hono@4.12.2/node_modules/ho","pass":true},"lintResult":{"command":"npm run lint","exitCode":1,"signal":null,"output":"\n> theres-always-a-deal@0.0.1 lint\n> turbo run lint\n\n• Packages in scope: @taad/api, @taad/db, @taad/scraper, @taad/web, @taad/worker\n• Running lint in 5 packages\n• Remote caching disabled, using shared worktree cache\n@taad/db:lint: cache miss, executing d7bd77830f061441\n@taad/db:build: cache hit, replaying logs 8d71d6c60edb1f02\n@taad/db:build: \r\n@taad/db:build: \u0004\r\n@taad/db:build: > @taad/db@0.0.1 build /Users/jacobfreck/Source/cadre/.cadre/configs/.cadre/state/worktrees/issue-21/packages/db\r\n@t","pass":false},"overallPass":true,"regressionFailures":[],"baselineFailures":[]}
```
