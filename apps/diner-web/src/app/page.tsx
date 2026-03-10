import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="rounded-xl bg-white p-10 shadow-sm">
      <p className="text-sm uppercase tracking-[0.2em] text-amber-700">NYC Dining</p>
      <h1 className="mt-3 text-4xl font-bold text-slate-900">Book your next reservation</h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        A production-style interview baseline app for a single active restaurant. Candidates can evolve this flow for multi-restaurant support with safe migrations and rollout strategies.
      </p>
      <div className="mt-8">
        <Link href="/book-reservation">
          <Button>Start booking</Button>
        </Link>
      </div>
    </section>
  );
}
