# Diner Web

Customer-facing reservation flow built with Next.js App Router, Auth.js credentials login, Tailwind, and shadcn-ready setup.

## Demo Login

The login page includes a one-click **Use demo account** action for interviews.

- Username: `demo-user`
- Password: `demo12345`

## Feature Flags with PostHog

Use PostHog flags to safely release new flows (for example, multi-restaurant selection):

```ts
import posthog from "posthog-js";

export function isRestaurantPickerEnabled(): boolean {
  return posthog.isFeatureEnabled("restaurant-picker-v2") ?? false;
}
```
