function getApiBaseUrl(): string {
  // NextAuth credentials flow runs on the server.
  if (typeof window === "undefined") {
    return process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
  }
  // Browser requests should use the public base URL.
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? "http://localhost:8000/api";
}

export type AvailabilityTime = {
  time: string;
  table: { id: number; seats: number };
};

export type UserReservation = {
  id: number;
  party_size: number;
  date: string;
  time: string;
  status: string;
  table: { id: number; label: string; seats: number };
};

export async function loginUser(username: string, password: string) {
  const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function registerUser(username: string, password: string) {
  const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function getAvailableDates(groupSize: number, startDate: string, endDate: string) {
  const res = await fetch(
    `${getApiBaseUrl()}/availability/dates?seats=${groupSize}&start=${startDate}&stop=${endDate}`,
    { cache: "no-store" }
  );
  return (await res.json()) as string[];
}

export async function getAvailableTimes(groupSize: number, date: string) {
  const res = await fetch(
    `${getApiBaseUrl()}/availability/times?seats=${groupSize}&date=${date}`,
    { cache: "no-store" }
  );
  return (await res.json()) as AvailabilityTime[];
}

export async function createReservation(accessToken: string, payload: { party_size: number; date: string; time: string }) {
  const res = await fetch(`${getApiBaseUrl()}/user/reservation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function listReservations(accessToken: string) {
  const res = await fetch(`${getApiBaseUrl()}/user/reservation`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data?.detail === "string" ? data.detail : "Could not load reservations.");
  }
  if (!Array.isArray(data)) {
    throw new Error("Unexpected reservations response.");
  }
  return data as UserReservation[];
}

export async function cancelReservation(accessToken: string, reservationId: number) {
  const res = await fetch(`${getApiBaseUrl()}/user/reservation/${reservationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.json();
}
