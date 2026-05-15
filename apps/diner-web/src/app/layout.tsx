import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { HeaderAuthControls } from "@/components/header-auth-controls";
import { PosthogProvider } from "@/components/posthog-provider";
import { authOptions } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cedar & Stone Steakhouse",
  description: "Refined steakhouse reservation flow"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const username = session?.user?.name ?? "Guest";
  const isAuthenticated = Boolean(session);
  return (
    <html lang="en">
      <body>
        <PosthogProvider>
          <header className="border-b border-brand/10 bg-cream/80 backdrop-blur">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-4 sm:py-5">
              <Link
                href="/"
                className="max-w-[220px] font-display text-xl font-semibold leading-tight tracking-[-0.04em] sm:max-w-none sm:text-2xl"
              >
                Cedar & Stone Steakhouse
              </Link>

              <HeaderAuthControls username={username} isAuthenticated={isAuthenticated} />
            </nav>
          </header>
          <main className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-3 py-4 sm:p-6">{children}</main>
        </PosthogProvider>
      </body>
    </html>
  );
}
