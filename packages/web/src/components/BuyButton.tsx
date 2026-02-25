interface BuyButtonProps {
  href: string;
  storeName: string;
}

export default function BuyButton({ href, storeName }: BuyButtonProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      Buy on {storeName}
    </a>
  );
}
