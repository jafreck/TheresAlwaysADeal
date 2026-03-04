```cadre-json
{
  "verdict": "needs-fixes",
  "summary": "The timing-safe comparison fix in jwt.ts is correct. However, the email worker duplicates the HMAC token-signing logic from signUnsubscribeToken() using process.env.JWT_SECRET! directly instead of sharing the implementation, creating a drift risk where the two implementations could become incompatible.",
  "issues": [
    {
      "file": "packages/worker/src/index.ts",
      "line": 431,
      "severity": "warning",
      "description": "Duplicated HMAC signing logic: the unsubscribe token is manually constructed here (createHmac + base64url) identically to signUnsubscribeToken() in packages/api/src/lib/jwt.ts. If the signing algorithm, key source, or payload format changes in one place but not the other, tokens will be incompatible (worker-signed tokens won't verify in the API). Extract the signing function into a shared package (e.g. @taad/db or a new @taad/crypto) that both @taad/worker and @taad/api can import from."
    }
  ]
}
```
