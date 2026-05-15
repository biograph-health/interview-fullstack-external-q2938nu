import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-brand/10 bg-[#fbf7f1]/[0.85] shadow-[0_30px_100px_rgba(21,18,13,0.12)] backdrop-blur">
      <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:p-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Cedar & Stone Steakhouse</p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[0.92] tracking-[-0.07em] text-brand sm:text-7xl">
            Reserve an evening around the grill
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-stone-700 sm:text-lg">
            A production-style interview baseline for a refined steakhouse reservation experience. Candidates can
            evolve this flow for multi-location support with safe migrations and rollout strategies.
          </p>
          <div className="mt-8">
            <Link href="/book-reservation">
              <Button>Start booking</Button>
            </Link>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-brand/10 bg-brand p-6 text-cream shadow-[0_24px_80px_rgba(21,18,13,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cream/60">Tonight's focus</p>
          <div className="mt-8 space-y-5">
            <div>
              <p className="font-display text-4xl font-semibold tracking-[-0.05em]">Prime cuts</p>
              <p className="mt-2 text-sm leading-6 text-cream/70">Dry-aged steaks, quiet service, and paced dining.</p>
            </div>
            <div className="border-t border-white/10 pt-5">
              <p className="font-display text-4xl font-semibold tracking-[-0.05em]">14 days</p>
              <p className="mt-2 text-sm leading-6 text-cream/70">Live reservation inventory for realistic booking flows.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
