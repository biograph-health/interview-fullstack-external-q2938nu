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
      <div className="hidden items-center gap-4 text-sm md:flex">
        <Link href="/book-reservation">Book</Link>
        <Link href="/view-reservations">My Reservations</Link>
        {isAuthenticated ? (
          <>
            <span className="text-slate-500">{username}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Login
          </Link>
        )}
      </div>

      <details className="relative md:hidden">
        <summary className="list-none rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900">
          Menu
        </summary>
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-10 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <Link href="/book-reservation" className="block rounded-xl px-3 py-2 text-sm text-slate-900 hover:bg-slate-50">
            Book
          </Link>
          <Link
            href="/view-reservations"
            className="block rounded-xl px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
          >
            My Reservations
          </Link>
          <div className="rounded-xl px-3 py-2 text-sm text-slate-500">{username}</div>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50">
              Login
            </Link>
          )}
        </div>
      </details>
    </>
  );
}
