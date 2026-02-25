const STORE_CONFIGS: Record<string, { envVar: string; paramKey: string }> = {
  steam: { envVar: "STEAM_AFFILIATE_TAG", paramKey: "partner" },
  gog: { envVar: "GOG_AFFILIATE_ID", paramKey: "affiliate_id" },
  epic: { envVar: "EPIC_CREATOR_TAG", paramKey: "epic_creator_id" },
  humble: { envVar: "HUMBLE_PARTNER_ID", paramKey: "partner" },
  "humble-bundle": { envVar: "HUMBLE_PARTNER_ID", paramKey: "partner" },
  fanatical: { envVar: "FANATICAL_REF", paramKey: "ref" },
};

/**
 * Appends the appropriate affiliate query parameter to a store URL based on
 * the store slug and configured environment variables.
 * Returns the URL unchanged if no affiliate tag is configured for the store.
 */
export function buildReferralUrl(baseUrl: string, storeSlug: string): string {
  const config = STORE_CONFIGS[storeSlug];
  if (!config) return baseUrl;

  const tag = process.env[config.envVar];
  if (!tag) return baseUrl;

  const url = new URL(baseUrl);
  url.searchParams.set(config.paramKey, tag);
  return url.toString();
}
