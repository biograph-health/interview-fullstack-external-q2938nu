const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000/api";
const MANAGEMENT_API_TOKEN = process.env.MANAGEMENT_API_TOKEN ?? "local-management-token";

async function getUpcomingReservations() {
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

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Restaurant Management Console</h1>
      <p className="mt-2 text-sm text-slate-600">
        Upcoming booked reservations for the next 7 days.
      </p>
      <div className="mt-6 space-y-3">
        {Array.isArray(reservations) &&
          reservations.map((item: any) => (
            <div key={item.id} className="rounded border p-3">
              <p className="font-medium">
                {item.date} {item.time} · {item.username}
              </p>
              <p className="text-sm text-slate-600">
                Party of {item.party_size} · Table {item.table.label} ({item.table.seats} seats)
              </p>
            </div>
          ))}
        {Array.isArray(reservations) && reservations.length === 0 && (
          <p className="text-slate-500">No upcoming reservations.</p>
        )}
      </div>
    </section>
  );
}
