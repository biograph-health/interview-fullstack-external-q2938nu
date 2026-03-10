"use client";

import posthog from "posthog-js";

export function isRestaurantPickerEnabled(): boolean {
  return posthog.isFeatureEnabled("restaurant-picker-v2") ?? false;
}
