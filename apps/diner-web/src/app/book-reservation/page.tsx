import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { BookingFlow } from "@/components/booking-flow";
import { authOptions } from "@/lib/auth";

export default async function BookReservationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    redirect("/login");
  }
  return <BookingFlow accessToken={session.accessToken} />;
}
