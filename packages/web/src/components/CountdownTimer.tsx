 
"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  expiresAt: string;
}

function getTimeRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
  const days = Math.floor(diff / 1000 / 60 / 60 / 24);

  return { days, hours, minutes, seconds };
}

export default function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState(() => getTimeRemaining(expiresAt));

  useEffect(() => {
    setMounted(true);
    setRemaining(getTimeRemaining(expiresAt));

    const interval = setInterval(() => {
      const r = getTimeRemaining(expiresAt);
      setRemaining(r);
      if (!r) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!mounted) {
    return <span suppressHydrationWarning>…</span>;
  }

  if (!remaining) {
    return <span>Expired</span>;
  }

  return (
    <span suppressHydrationWarning>
      {remaining.days}d {remaining.hours}h {remaining.minutes}m{" "}
      {remaining.seconds}s
    </span>
  );
}
