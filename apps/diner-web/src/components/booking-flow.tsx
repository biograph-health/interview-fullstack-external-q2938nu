"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { createReservation, getAvailableDates, getAvailableTimes, type AvailabilityTime } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Props = {
  accessToken: string;
};

type ConfirmedReservation = {
  id: number;
  party_size: number;
  date: string;
  time: string;
  status: string;
  table: { id: number; label: string; seats: number };
};

const TOTAL_STEPS = 4;
const PARTY_SIZE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STEP_LABELS = [
  { id: 1, title: "Guests", description: "Choose party size" },
  { id: 2, title: "Date", description: "Select a day" },
  { id: 3, title: "Time", description: "Pick a table" },
  { id: 4, title: "Confirm", description: "Review details" }
] as const;

function isoDate(offsetDays: number): string {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  return now.toISOString().split("T")[0];
}

function formatMonthLabel(value: Date): string {
  return value.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatLongDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function formatShortDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function formatDateChip(value: string): { weekday: string; day: string } {
  const date = new Date(`${value}T00:00:00`);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    day: date.toLocaleDateString("en-US", { day: "numeric" })
  };
}

export function BookingFlow({ accessToken }: Props) {
  const [step, setStep] = useState(1);
  const [partySize, setPartySize] = useState(2);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [times, setTimes] = useState<AvailabilityTime[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [result, setResult] = useState<string>("");
  const [confirmedReservation, setConfirmedReservation] = useState<ConfirmedReservation | null>(null);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    return now;
  });

  const dateRange = useMemo(() => ({ start: isoDate(1), end: isoDate(14) }), []);
  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);
  const quickDateOptions = useMemo(() => availableDates.slice(0, 7), [availableDates]);

  const rangeStart = useMemo(() => new Date(`${dateRange.start}T00:00:00`), [dateRange.start]);
  const rangeEnd = useMemo(() => new Date(`${dateRange.end}T00:00:00`), [dateRange.end]);
  const monthStart = useMemo(
    () => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1),
    [visibleMonth]
  );
  const monthDays = useMemo(
    () => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate(),
    [visibleMonth]
  );
  const minVisibleMonth = useMemo(
    () => new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1),
    [rangeStart]
  );
  const maxVisibleMonth = useMemo(
    () => new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1),
    [rangeEnd]
  );

  const dayCells = useMemo(() => {
    const items: Array<string | null> = [];
    const leading = monthStart.getDay();
    for (let i = 0; i < leading; i += 1) items.push(null);
    for (let day = 1; day <= monthDays; day += 1) {
      const value = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
      const iso = value.toISOString().split("T")[0];
      items.push(iso);
    }
    return items;
  }, [monthDays, monthStart, visibleMonth]);

  async function loadDates() {
    setIsLoadingDates(true);
    setResult("");
    try {
      const dates = await getAvailableDates(partySize, dateRange.start, dateRange.end);
      setAvailableDates(dates);
      setSelectedDate("");
      setSelectedTime("");
      setTimes([]);
      const startingMonth = new Date(`${dateRange.start}T00:00:00`);
      startingMonth.setDate(1);
      setVisibleMonth(startingMonth);
      setStep(2);
    } catch {
      setResult("We could not load availability right now. Please try again.");
    } finally {
      setIsLoadingDates(false);
    }
  }

  async function loadTimes() {
    if (!selectedDate) return;
    setIsLoadingTimes(true);
    setResult("");
    try {
      const response = await getAvailableTimes(partySize, selectedDate);
      setTimes(response);
      setSelectedTime("");
      setStep(3);
    } catch {
      setResult("We could not load times for that date. Please try another day.");
    } finally {
      setIsLoadingTimes(false);
    }
  }

  async function confirmBooking() {
    setIsSubmitting(true);
    setResult("");
    try {
      const response = await createReservation(accessToken, {
        party_size: partySize,
        date: selectedDate,
        time: selectedTime
      });
      if (response.id) {
        setConfirmedReservation(response);
        setStep(4);
        return;
      }
      setConfirmedReservation(null);
      setResult(response.detail ?? "Could not book reservation.");
    } catch {
      setConfirmedReservation(null);
      setResult("We could not confirm your reservation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBack() {
    if (step <= 1) return;
    setResult("");
    setStep(step - 1);
  }

  function isInRequestedRange(iso: string): boolean {
    const value = new Date(`${iso}T00:00:00`);
    return value >= rangeStart && value <= rangeEnd;
  }

  const canGoToPreviousMonth = monthStart.getTime() > minVisibleMonth.getTime();
  const canGoToNextMonth = monthStart.getTime() < maxVisibleMonth.getTime();
  const selectedDateLabel = selectedDate ? formatLongDate(selectedDate) : "Choose a date";
  const selectedTimeLabel = selectedTime || "Choose a time";
  const selectedTable = times.find((slot) => slot.time === selectedTime)?.table;
  const currentStepLabel = STEP_LABELS[Math.min(step - 1, STEP_LABELS.length - 1)];
  const isPartySizeValid = PARTY_SIZE_OPTIONS.includes(partySize);

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:rounded-[32px]">
      <div className="grid min-w-0 gap-6 border-b border-slate-800 bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)] lg:px-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              Reservation
            </span>
          </div>
          <p className="mt-6 text-sm uppercase tracking-[0.24em] text-slate-400">The Gilded Gobbler</p>
          <h1 className="mt-3 max-w-3xl break-words font-serif text-[2.6rem] font-semibold leading-[0.95] tracking-tight sm:text-5xl">
            Reserve a spot at the hottest turkey burger in Manhattan
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Pick your party size, browse live availability over the next two weeks, and lock in a table without
            leaving the page.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-white/10 px-3 py-1">Step {step} of {TOTAL_STEPS}</span>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Party</p>
            <p className="mt-2 text-2xl font-semibold">{partySize}</p>
            <p className="mt-1 text-sm text-slate-300">guest{partySize === 1 ? "" : "s"}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Date</p>
            <p className="mt-2 text-lg font-semibold">{selectedDate ? formatShortDate(selectedDate) : "Not selected"}</p>
            <p className="mt-1 text-sm text-slate-300">{selectedDate ? formatLongDate(selectedDate) : "Choose from the next 14 days"}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Time</p>
            <p className="mt-2 text-lg font-semibold">{selectedTime || "Not selected"}</p>
            <p className="mt-1 text-sm text-slate-300">
              {selectedTable ? `Table ${selectedTable.id}, seats ${selectedTable.seats}` : "Pick a slot to continue"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 bg-slate-50 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {STEP_LABELS.map((item) => {
              const isActive = item.id === step;
              const isComplete = item.id < step;

              return (
                <div
                  key={item.id}
                  className={[
                    "rounded-2xl border p-4 transition",
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                      : "",
                    !isActive && isComplete ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "",
                    !isActive && !isComplete ? "border-slate-200 bg-white text-slate-500" : ""
                  ].join(" ")}
                >
                  <p
                    className={[
                      "text-xs font-semibold uppercase tracking-[0.16em]",
                      isActive ? "text-slate-300" : "",
                      !isActive && isComplete ? "text-emerald-700" : "",
                      !isActive && !isComplete ? "text-slate-400" : ""
                    ].join(" ")}
                  >
                    Step {item.id}
                  </p>
                  <p className="mt-2 text-base font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{currentStepLabel.title}</p>
              <h2 className="mt-3 break-words font-serif text-[2.25rem] font-semibold leading-[0.98] tracking-tight text-slate-900 sm:text-3xl">
                How many guests are joining?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Start with your party size and we will tailor the calendar to tables that can comfortably fit your
                group.
              </p>

              <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-4">
                {PARTY_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={partySize === size}
                    onClick={() => setPartySize(size)}
                    className={[
                      "rounded-2xl border px-4 py-4 text-left transition",
                      partySize === size
                        ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                    ].join(" ")}
                  >
                    <p
                      className={[
                        "text-xs uppercase tracking-[0.16em]",
                        partySize === size ? "text-slate-300" : "text-slate-500"
                      ].join(" ")}
                    >
                      Party size
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{size}</p>
                    <p className="mt-1 text-sm">{size === 1 ? "Solo table" : `${size} guests`}</p>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:mt-8 sm:pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  Dinner inventory refreshes live as you move through the flow.
                </div>
                <Button disabled={!isPartySizeValid || isLoadingDates} className="px-6 py-3" onClick={loadDates}>
                  {isLoadingDates ? "Finding available dates..." : "See available dates"}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{currentStepLabel.title}</p>
                  <h2 className="mt-3 break-words font-serif text-[2.25rem] font-semibold leading-[0.98] tracking-tight text-slate-900 sm:text-3xl">
                    Choose a date that works for your group.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Available days appear as dark, bookable tiles. We are only showing the next 14 days of inventory.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Party size: <span className="font-semibold text-slate-900">{partySize}</span>
                </div>
              </div>

              {availableDates.length > 0 ? (
                <>
                  <div className="mt-8 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Quick picks</p>
                    <div className="mt-3 flex max-w-full gap-3 overflow-x-auto pb-2">
                      {quickDateOptions.map((iso) => {
                        const option = formatDateChip(iso);
                        const selected = selectedDate === iso;
                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => {
                              setSelectedDate(iso);
                              setSelectedTime("");
                            }}
                            className={[
                              "min-w-[88px] rounded-2xl border px-4 py-3 text-left transition",
                              selected
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                            ].join(" ")}
                          >
                            <p
                              className={[
                                "text-xs uppercase tracking-[0.14em]",
                                selected ? "text-slate-300" : "text-slate-500"
                              ].join(" ")}
                            >
                              {option.weekday}
                            </p>
                            <p className="mt-2 text-2xl font-semibold">{option.day}</p>
                            <p className="mt-1 text-sm">{formatShortDate(iso)}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:mt-8 sm:rounded-[28px] sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <Button
                        variant="secondary"
                        disabled={!canGoToPreviousMonth}
                        className="px-3 py-2 sm:px-4 sm:py-2"
                        onClick={() =>
                          setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))
                        }
                      >
                        Previous
                      </Button>
                      <p className="text-center text-sm font-semibold text-slate-900 sm:text-base">{formatMonthLabel(visibleMonth)}</p>
                      <Button
                        variant="secondary"
                        disabled={!canGoToNextMonth}
                        className="px-3 py-2 sm:px-4 sm:py-2"
                        onClick={() =>
                          setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))
                        }
                      >
                        Next
                      </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 sm:gap-2 sm:text-xs sm:tracking-[0.12em]">
                      {WEEKDAY_LABELS.map((day) => (
                        <div key={day} className="py-1">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-2">
                      {dayCells.map((iso, idx) => {
                        if (!iso) return <div key={`blank-${idx}`} className="aspect-square rounded-2xl bg-transparent" />;

                        const inRange = isInRequestedRange(iso);
                        const available = inRange && availableDateSet.has(iso);
                        const selected = selectedDate === iso;

                        return (
                          <button
                            key={iso}
                            type="button"
                            disabled={!available}
                            onClick={() => {
                              setSelectedDate(iso);
                              setSelectedTime("");
                            }}
                            className={[
                              "aspect-square rounded-xl border text-xs font-semibold transition sm:rounded-2xl sm:text-base",
                              selected ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "",
                              !selected && available
                                ? "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-100"
                                : "",
                              !available && inRange ? "cursor-not-allowed border-transparent bg-slate-200 text-slate-400" : "",
                              !inRange ? "cursor-not-allowed border-transparent bg-slate-100 text-slate-300" : ""
                            ].join(" ")}
                          >
                            {new Date(`${iso}T00:00:00`).getDate()}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                      <p>Dark tiles are available for your group size.</p>
                      <p>Selected date: <span className="font-semibold text-slate-900">{selectedDate ? selectedDateLabel : "None yet"}</span></p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center sm:mt-8 sm:rounded-[28px] sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">No dates found</p>
                  <h3 className="mt-3 font-serif text-2xl font-semibold text-slate-900">No tables are currently available.</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Try a smaller party size or check again later as reservations open up.
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:mt-8 sm:pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="secondary" onClick={goBack}>
                  Back
                </Button>
                <Button disabled={!selectedDate || isLoadingTimes} className="px-6 py-3" onClick={loadTimes}>
                  {isLoadingTimes ? "Loading times..." : "Continue to times"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{currentStepLabel.title}</p>
                  <h2 className="mt-3 break-words font-serif text-[2.25rem] font-semibold leading-[0.98] tracking-tight text-slate-900 sm:text-3xl">
                    Select a time for {selectedDate ? formatShortDate(selectedDate) : "your reservation"}.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Each slot reflects a real table assignment in the dining room. Times are shown in ET.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {selectedDate ? selectedDateLabel : "Choose a date first"}
                </div>
              </div>

              {times.length > 0 ? (
                <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 xl:grid-cols-3">
                  {times.map((slot) => {
                    const selected = selectedTime === slot.time;

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        className={[
                          "rounded-3xl border px-5 py-4 text-left transition",
                          selected
                            ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                            : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                        ].join(" ")}
                      >
                        <p className="text-xl font-semibold sm:text-2xl">{slot.time}</p>
                        <p className={["mt-2 text-sm", selected ? "text-slate-300" : "text-slate-500"].join(" ")}>
                          Dining room
                        </p>
                        <p className={["mt-1 text-sm", selected ? "text-slate-300" : "text-slate-500"].join(" ")}>
                          Table {slot.table.id} for up to {slot.table.seats}
                        </p>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em]">
                          {selected ? "Selected" : "Tap to choose"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center sm:mt-8 sm:rounded-[28px] sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">No times found</p>
                  <h3 className="mt-3 font-serif text-2xl font-semibold text-slate-900">This date no longer has bookable tables.</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Head back to choose another date and we will refresh the available inventory.
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:mt-8 sm:pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="secondary" onClick={goBack}>
                  Back
                </Button>
                <Button disabled={!selectedTime || isSubmitting} className="px-6 py-3" onClick={confirmBooking}>
                  {isSubmitting ? "Confirming reservation..." : "Confirm reservation"}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="min-w-0 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 shadow-sm sm:rounded-[28px] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Reservation confirmed</p>
              <h2 className="mt-3 break-words font-serif text-[2.25rem] font-semibold leading-[0.98] tracking-tight text-emerald-950 sm:text-3xl">
                Your table is booked.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-900/80">
                We have held your reservation and saved the details below. You can review or manage it from your reservations page.
              </p>

              {confirmedReservation && (
                <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2">
                  <div className="rounded-3xl border border-emerald-200 bg-white/70 p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Date</p>
                    <p className="mt-2 text-lg font-semibold text-emerald-950">{formatLongDate(confirmedReservation.date)}</p>
                  </div>
                  <div className="rounded-3xl border border-emerald-200 bg-white/70 p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Time</p>
                    <p className="mt-2 text-lg font-semibold text-emerald-950">{confirmedReservation.time}</p>
                  </div>
                  <div className="rounded-3xl border border-emerald-200 bg-white/70 p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Party</p>
                    <p className="mt-2 text-lg font-semibold text-emerald-950">
                      {confirmedReservation.party_size} guest{confirmedReservation.party_size === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-emerald-200 bg-white/70 p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Table</p>
                    <p className="mt-2 text-lg font-semibold text-emerald-950">
                      {confirmedReservation.table.label} / {confirmedReservation.table.seats} seats
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-emerald-200 pt-5 sm:mt-8 sm:pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-emerald-900/80">
                  Status: <span className="font-semibold text-emerald-950">{confirmedReservation?.status ?? "Confirmed"}</span>
                </div>
                <Link
                  href="/view-reservations"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Go to My Reservations
                </Link>
              </div>
            </div>
          )}

          {result && step !== 4 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {result}
            </div>
          )}
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6 lg:sticky lg:top-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reservation summary</p>
            <h3 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-slate-900">
              Review as you go.
            </h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Restaurant</p>
                <p className="mt-2 text-base font-semibold text-slate-900">The Gilded Gobbler</p>
                <p className="mt-1 text-sm text-slate-600">Dining room seating only</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Guests</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {partySize} guest{partySize === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Date</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{selectedDateLabel}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Time</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{selectedTimeLabel}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedTable ? `Table ${selectedTable.id}, seats ${selectedTable.seats}` : "No table selected yet"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cancellation policy</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>Cancellations for this restaurant are subject to a $50 charge.</p>
              <p>If your plans change, cancel before booking only if you are comfortable with that fee.</p>
              <p>Please review your date, time, and party size carefully before confirming.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
