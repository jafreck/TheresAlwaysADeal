export interface Deal {
  gameTitle: string;
  gameSlug: string;
  headerImageUrl: string;
  price: number;
  originalPrice: number;
  discount: number;
  storeName: string;
  storeLogoUrl?: string | null;
  storeUrl: string;
  dealScore?: number | null;
}
