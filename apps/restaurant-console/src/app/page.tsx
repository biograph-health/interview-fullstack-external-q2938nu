const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000/api";
const MANAGEMENT_API_TOKEN = process.env.MANAGEMENT_API_TOKEN ?? "local-management-token";

type Reservation = {
  id: number;
  date: string;
  time: string;
  username: string;
  party_size: number;
  table: {
    label: string;
    seats: number;
  };
};

async function getUpcomingReservations(): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/management/reservations/upcoming-week`, {
    headers: {
      "X-Management-Token": MANAGEMENT_API_TOKEN
    },
    cache: "no-store"
  });
  return res.json();
}

export default async function ManagementPage() {
  const reservations = await getUpcomingReservations();
  const reservationItems: Reservation[] = Array.isArray(reservations) ? reservations : [];
  const totalGuests = reservationItems.reduce((total, item) => total + item.party_size, 0);
  const tableCount = new Set(reservationItems.map((item) => item.table.label)).size;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-brand/10 bg-[#fffaf4] shadow-[0_30px_100px_rgba(21,18,13,0.12)]">
      <div className="grid gap-8 bg-brand px-5 py-7 text-cream sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1.3fr)_420px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e9cda6]">Management</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">
            Cedar & Stone service board
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-cream/70 sm:text-base">
            A polished overview of the upcoming week, built for host stand triage and interview-ready operations
            workflows.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-3xl border border-white/[0.12] bg-white/[0.07] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-cream/60">Reservations</p>
            <p className="mt-2 text-3xl font-semibold">{reservationItems.length}</p>
          </div>
          <div className="rounded-3xl border border-white/[0.12] bg-white/[0.07] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-cream/60">Guests</p>
            <p className="mt-2 text-3xl font-semibold">{totalGuests}</p>
          </div>
          <div className="rounded-3xl border border-white/[0.12] bg-white/[0.07] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-cream/60">Tables</p>
            <p className="mt-2 text-3xl font-semibold">{tableCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#fbf7f1] p-5 sm:p-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Upcoming week</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-brand">Booked tables</h2>
          </div>
          <p className="text-sm text-stone-600">Synced from the management reservations API.</p>
        </div>

        <div className="space-y-3">
          {reservationItems.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 rounded-[1.5rem] border border-brand/10 bg-[#fffaf4] p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center sm:p-5"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  Reservation #{item.id}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-brand">
                  {item.username}
                </h3>
                <p className="mt-2 text-sm text-stone-600">
                  {item.date} at {item.time}
                </p>
              </div>
              <div className="grid gap-2 text-sm sm:text-right">
                <p className="font-semibold text-brand">
                  Party of {item.party_size}
                </p>
                <p className="text-stone-600">
                  Table {item.table.label} · {item.table.seats} seats
                </p>
              </div>
            </article>
          ))}

          {reservationItems.length === 0 && (
            <div className="rounded-[1.5rem] border border-dashed border-brand/20 bg-[#fffaf4] p-8 text-center">
              <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-brand">
                No upcoming reservations.
              </p>
              <p className="mt-2 text-sm text-stone-600">New bookings will appear here as guests reserve tables.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
