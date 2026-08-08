"use client";

import { ExternalLink } from "lucide-react";
import { PRE_PPL_PHYSICAL_AMAZON_URL } from "@/lib/pre-ppl";
import { createTrackingCtaMetadata, trackCtaClicked } from "@/lib/tracking/client";

export function PrePplPhysicalAmazonButton({ className }: { className: string }) {
  if (!PRE_PPL_PHYSICAL_AMAZON_URL) {
    return (
      <button type="button" disabled aria-describedby="pre-ppl-amazon-note" className={className}>
        Comprar en Amazon
      </button>
    );
  }

  return (
    <a
      href={PRE_PPL_PHYSICAL_AMAZON_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        const metadata = createTrackingCtaMetadata("preppl_physical_amazon");
        if (metadata) trackCtaClicked(metadata);
      }}
      className={className}
    >
      Comprar en Amazon
      <ExternalLink className="h-4 w-4" aria-hidden />
    </a>
  );
}
