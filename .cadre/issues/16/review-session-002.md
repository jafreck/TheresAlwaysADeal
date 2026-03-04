```cadre-json
{
  "verdict": "needs-fixes",
  "summary": "The GDPR account deletion endpoint does not nullify `slackWebhookUrl` during anonymization, leaving a user-specific Slack webhook URL intact after account deletion. This is a data-retention gap that conflicts with the GDPR anonymization requirement.",
  "issues": [
    {
      "file": "packages/api/src/routes/user.ts",
      "line": 179,
      "severity": "warning",
      "description": "GDPR deletion does not clear `slackWebhookUrl`. A Slack webhook URL is user-configured data that can identify or link to the user's workspace. It should be set to `null` in the `.set(...)` call alongside the other PII fields being anonymized."
    }
  ]
}
```
