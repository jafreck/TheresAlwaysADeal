import { cn } from "../lib/utils";

interface StoreIconProps {
  storeName: string;
  size?: number;
  className?: string;
}

const storeAbbreviations: Record<string, string> = {
  Steam: "ST",
  GOG: "GOG",
  "Epic Games": "EG",
  "Humble Bundle": "HB",
  Fanatical: "FN",
};

const storeColors: Record<string, string> = {
  Steam: "bg-[#1b2838] text-white",
  GOG: "bg-[#86328a] text-white",
  "Epic Games": "bg-[#2a2a2a] text-white",
  "Humble Bundle": "bg-[#cc3333] text-white",
  Fanatical: "bg-[#ff6600] text-white",
};

export function StoreIcon({
  storeName,
  size = 32,
  className,
}: StoreIconProps) {
  const abbreviation =
    storeAbbreviations[storeName] ?? storeName.charAt(0).toUpperCase();
  const colorClass = storeColors[storeName] ?? "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-bold",
        colorClass,
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      title={storeName}
      aria-label={storeName}
    >
      {abbreviation}
    </span>
  );
}
