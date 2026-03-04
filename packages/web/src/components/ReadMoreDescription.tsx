"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface ReadMoreDescriptionProps {
  description: string;
  maxLength?: number;
  className?: string;
}

export default function ReadMoreDescription({
  description,
  maxLength = 300,
  className,
}: ReadMoreDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = description.length > maxLength;
  const displayText =
    needsTruncation && !expanded
      ? description.slice(0, maxLength) + "…"
      : description;

  return (
    <div className={cn("text-sm leading-relaxed text-muted", className)}>
      <p>{displayText}</p>
      {needsTruncation && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 text-sm font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
