"use client";

import { useEffect } from "react";
import { trackPageViewed } from "@/lib/tracking/client";
import { initializeTrackingContext } from "@/lib/tracking/session";

export function PrePplPageTracking() {
  useEffect(() => {
    initializeTrackingContext();
    trackPageViewed("pre_ppl");
  }, []);

  return null;
}
