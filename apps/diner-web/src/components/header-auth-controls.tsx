"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

type Props = {
  username: string;
  isAuthenticated: boolean;
};

export function HeaderAuthControls({ username, isAuthenticated }: Props) {
  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <div className="hidden items-center gap-5 text-sm font-medium text-brand/75 md:flex">
        <Link href="/book-reservation" className="transition hover:text-brand">
          Book
        </Link>
        <Link href="/view-reservations" className="transition hover:text-brand">
          My Reservations
        </Link>
        {isAuthenticated ? (
          <>
            <span className="text-stone-500">{username}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-brand/15 bg-white/40 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-white"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-full border border-brand/15 bg-white/40 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-white"
          >
            Login
          </Link>
        )}
      </div>

      <details className="relative md:hidden">
        <summary className="list-none rounded-full border border-brand/15 bg-white/40 px-4 py-2 text-sm font-semibold text-brand">
          Menu
        </summary>
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-10 w-56 rounded-2xl border border-brand/10 bg-[#fffaf4] p-2 shadow-xl">
          <Link href="/book-reservation" className="block rounded-xl px-3 py-2 text-sm text-brand hover:bg-[#f4eadc]">
            Book
          </Link>
          <Link
            href="/view-reservations"
            className="block rounded-xl px-3 py-2 text-sm text-brand hover:bg-[#f4eadc]"
          >
            My Reservations
          </Link>
          <div className="rounded-xl px-3 py-2 text-sm text-stone-500">{username}</div>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-brand hover:bg-[#f4eadc]"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="block rounded-xl px-3 py-2 text-sm font-semibold text-brand hover:bg-[#f4eadc]">
              Login
            </Link>
          )}
        </div>
      </details>
    </>
  );
}
