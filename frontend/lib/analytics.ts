"use client";

import posthog from "posthog-js";

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    console.warn("[analytics] NEXT_PUBLIC_POSTHOG_KEY not set — analytics tracking disabled.");
    return;
  }
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    capture_pageview: true,
    persistence: "localStorage",
  });
  initialized = true;
}

/**
 * Tracks a named event. Required events for Level 4 submission:
 * wallet_connected, funds_sent, expense_added, payment_completed
 * (all called at their relevant call sites throughout the app).
 * Safe to call even when analytics isn't configured — becomes a no-op.
 */
export function track(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, traits);
}
