"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getMyBookings, BookingItem } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code"; // <--- Display QR
import { toast } from "sonner";
import { format } from "date-fns";

export default function MyBookingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    const fetchBookings = async () => {
      try {
        const data = await getMyBookings();
        setBookings(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user, router]);

  if (!user) return null;

  return (
    <main className="container mx-auto py-12 px-4 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-2">← Home</Button>
        <h1 className="text-3xl font-bold">My Bookings</h1>
      </div>

      {loading ? <p>Loading...</p> : bookings.length === 0 ? (
        <p className="text-center text-gray-500">No bookings found.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id} className={b.status === "CONFIRMED" ? "border-green-200" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle>{b.lot_name}</CardTitle>
                  <span className={`text-sm font-bold ${b.status === "CONFIRMED" ? "text-green-600" : "text-gray-500"}`}>
                    {b.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{b.address}</p>
                <p className="text-sm mt-1">
                  {format(new Date(b.start_time), "MMM dd, HH:mm")} - {format(new Date(b.end_time), "HH:mm")}
                </p>

                {/* QR Code Dialog */}
                {b.status === "CONFIRMED" && b.qr_code_data && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-4">Show QR Code</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm flex flex-col items-center">
                      <DialogHeader>
                        <DialogTitle>Scan at Entry</DialogTitle>
                      </DialogHeader>
                      <div className="p-4 bg-white rounded-lg">
                        <QRCode value={b.qr_code_data} size={200} />
                      </div>
                      <p className="text-sm text-muted-foreground text-center mt-2">
                        Show this to the guard or host.
                      </p>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
