"use client";

import { useEffect, useState } from "react";

import { cancelReservation, listReservations, type UserReservation } from "@/lib/api";
import { Button } from "@/components/ui/button";

function formatReservationDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const easternDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(easternDate);
}

function formatReservationTime(time: string): string {
  const [rawHours = "0", rawMinutes = "0"] = time.split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;
  const normalizedMinutes = String(minutes).padStart(2, "0");

  return `${normalizedHours}:${normalizedMinutes} ${period} ET`;
}

export function ReservationsList({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<UserReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reservationToCancel, setReservationToCancel] = useState<UserReservation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  async function load() {
    setIsLoading(true);
    setError("");
    try {
      const data = await listReservations(accessToken);
      setItems(data);
    } catch {
      setError("We could not load your reservations right now. Please refresh and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmCancel() {
    if (!reservationToCancel) return;

    setIsCancelling(true);
    setError("");
    try {
      await cancelReservation(accessToken, reservationToCancel.id);
      setReservationToCancel(null);
      await load();
    } catch {
      setError("We could not cancel that reservation. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  }

  useEffect(() => {
    void load();
  }, [accessToken]);

  return (
    <>
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:rounded-[32px]">
        <div className="grid gap-6 border-b border-slate-800 bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)] lg:px-8">
          <div className="min-w-0">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              Reservations
            </span>
            <p className="mt-6 text-sm uppercase tracking-[0.24em] text-slate-400">The Gilded Gobbler</p>
            <h1 className="mt-3 max-w-3xl break-words font-serif text-[2.6rem] font-semibold leading-[0.95] tracking-tight sm:text-5xl">
              Manage your upcoming tables.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Review your upcoming bookings, double-check your dining details, and cancel if your plans change.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Upcoming</p>
              <p className="mt-2 text-2xl font-semibold">{items.length}</p>
              <p className="mt-1 text-sm text-slate-300">
                reservation{items.length === 1 ? "" : "s"} on your account
              </p>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-6 bg-slate-50 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <div className="min-w-0 space-y-5 sm:space-y-6">
            {error && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Loading</p>
                <h2 className="mt-3 font-serif text-[2.25rem] font-semibold leading-[0.98] tracking-tight text-slate-900 sm:text-3xl">
                  Fetching your reservations.
                </h2>
                <div className="mt-6 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="h-5 w-40 rounded bg-slate-200" />
                      <div className="mt-3 h-4 w-52 rounded bg-slate-200" />
                      <div className="mt-5 h-10 w-28 rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm sm:rounded-[28px] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">No upcoming reservations</p>
                <h2 className="mt-3 font-serif text-[2.25rem] font-semibold leading-[0.98] tracking-tight text-slate-900 sm:text-3xl">
                  Your next table is still waiting to be booked.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Once you book a reservation, it will appear here with the date, time, and cancellation controls.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                          Reservation #{item.id}
                        </p>
                        <h2 className="mt-2 break-words font-serif text-3xl font-semibold tracking-tight text-slate-900">
                          {formatReservationDate(item.date)}
                        </h2>
                        <p className="mt-2 text-base font-medium text-slate-600">{formatReservationTime(item.time)}</p>
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
                        {item.status}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Guests</p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                          {item.party_size} guest{item.party_size === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Table</p>
                        <p className="mt-2 text-base font-semibold text-slate-900">{item.table.label}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.table.seats} seats</p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500">
                        Please review the cancellation fee before releasing this table.
                      </p>
                      <Button variant="secondary" onClick={() => setReservationToCancel(item)}>
                        Cancel reservation
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="min-w-0 space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6 lg:sticky lg:top-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cancellation policy</p>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Cancellations for The Gilded Gobbler are subject to a $50 charge.
              </div>
            </div>
          </aside>
        </div>
      </section>

      {reservationToCancel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Confirm cancellation</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900">
              Cancel this reservation?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              You are about to cancel your table for {formatReservationDate(reservationToCancel.date)} at{" "}
              {formatReservationTime(reservationToCancel.time)}.
            </p>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              A $50 cancellation fee applies for this restaurant.
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" disabled={isCancelling} onClick={() => setReservationToCancel(null)}>
                Keep reservation
              </Button>
              <Button disabled={isCancelling} onClick={confirmCancel}>
                {isCancelling ? "Cancelling..." : "Yes, cancel reservation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
