import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { ReservationsList } from "@/components/reservations-list";
import { authOptions } from "@/lib/auth";

export default async function ViewReservationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    redirect("/login");
  }
  return <ReservationsList accessToken={session.accessToken} />;
}
