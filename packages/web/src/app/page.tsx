import { GameCard } from "@/components/GameCard";

const mockDeals = [
  {
    title: "Cyberpunk 2077",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
    currentPrice: 29.99,
    originalPrice: 59.99,
    discount: 50,
    storeName: "Steam",
    storeUrl: "https://store.steampowered.com/app/1091500",
  },
  {
    title: "Elden Ring",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg",
    currentPrice: 35.99,
    originalPrice: 59.99,
    discount: 40,
    storeName: "Steam",
    storeUrl: "https://store.steampowered.com/app/1245620",
  },
  {
    title: "Baldur's Gate 3",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg",
    currentPrice: 53.99,
    originalPrice: 59.99,
    discount: 10,
    storeName: "GOG",
    storeUrl: "https://www.gog.com/game/baldurs_gate_3",
  },
  {
    title: "Hades II",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1145350/header.jpg",
    currentPrice: 19.99,
    originalPrice: 29.99,
    discount: 33,
    storeName: "Epic",
    storeUrl: "https://store.epicgames.com/p/hades-ii",
  },
  {
    title: "The Witcher 3: Wild Hunt",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg",
    currentPrice: 7.49,
    originalPrice: 29.99,
    discount: 75,
    storeName: "Steam",
    storeUrl: "https://store.steampowered.com/app/292030",
  },
  {
    title: "Red Dead Redemption 2",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg",
    currentPrice: 19.79,
    originalPrice: 59.99,
    discount: 67,
    storeName: "Steam",
    storeUrl: "https://store.steampowered.com/app/1174180",
  },
];

export default function HomePage() {
  return (
    <div>
      <h1 className="mb-6 text-heading-xl font-bold tracking-tight text-foreground">
        Today&apos;s Best Deals
      </h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockDeals.map((deal) => (
          <GameCard key={deal.title} {...deal} />
        ))}
      </div>
    </div>
  );
}
