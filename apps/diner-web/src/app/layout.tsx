import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { HeaderAuthControls } from "@/components/header-auth-controls";
import { PosthogProvider } from "@/components/posthog-provider";
import { authOptions } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Gilded Gobbler",
  description: "Interview baseline reservation flow"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const username = session?.user?.name ?? "Guest";
  const isAuthenticated = Boolean(session);
  return (
    <html lang="en">
      <body>
        <PosthogProvider>
          <header className="border-b bg-white">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-3 py-3 sm:px-4 sm:py-4">
              <Link href="/" className="max-w-[190px] text-xl font-bold leading-tight tracking-tight sm:max-w-none">
                The Gilded Gobbler
              </Link>

              <HeaderAuthControls username={username} isAuthenticated={isAuthenticated} />
            </nav>
          </header>
          <main className="mx-auto min-w-0 max-w-5xl overflow-x-hidden px-2 py-3 sm:p-6">{children}</main>
        </PosthogProvider>
      </body>
    </html>
  );
}
