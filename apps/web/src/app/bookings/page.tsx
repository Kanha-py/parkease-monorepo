"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getMyBookings, BookingItem } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import { Loader2, QrCode, MapPin, Clock } from "lucide-react";
import { WriteReviewModal } from "@/components/reviews/WriteReviewModal"; // <--- Import Review Modal

export default function MyBookingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/"); return; }
    const fetchBookings = async () => {
      try {
        const data = await getMyBookings();
        setBookings(data);
      } catch (error) {
        toast.error("Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user, router]);

  if (!user) return null;

  const activeBookings = bookings.filter(b => !isPast(new Date(b.end_time)) && b.status !== "CANCELLED");
  const pastBookings = bookings.filter(b => isPast(new Date(b.end_time)) || b.status === "CANCELLED");

  return (
    <main className="container mx-auto py-8 px-4 max-w-3xl min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
            <p className="text-slate-500">Manage your upcoming and past spots.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/")}>Book New Spot</Button>
      </div>

      {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : (
        <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="active">Upcoming ({activeBookings.length})</TabsTrigger>
                <TabsTrigger value="past">History ({pastBookings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
                {activeBookings.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-500 mb-4">No active bookings.</p>
                        <Button onClick={() => router.push("/")}>Find a Spot</Button>
                    </div>
                ) : (
                    activeBookings.map((b) => <BookingCard key={b.id} booking={b} isActive={true} />)
                )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
                {pastBookings.map((b) => <BookingCard key={b.id} booking={b} isActive={false} />)}
            </TabsContent>
        </Tabs>
      )}
    </main>
  );
}

function BookingCard({ booking, isActive }: { booking: BookingItem, isActive: boolean }) {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    const [showReview, setShowReview] = useState(false); // <--- Local state for modal

    return (
        <Card className={`overflow-hidden transition-all ${isActive ? 'border-blue-100 shadow-sm hover:shadow-md' : 'opacity-90 bg-slate-50'}`}>
            <CardContent className="p-0 flex flex-col sm:flex-row">

                {/* Date */}
                <div className={`p-4 sm:w-24 flex sm:flex-col items-center justify-center gap-2 text-center ${isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    <span className="text-xs font-bold uppercase tracking-wider">{format(start, "MMM")}</span>
                    <span className="text-2xl font-bold leading-none">{format(start, "dd")}</span>
                </div>

                {/* Info */}
                <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">{booking.lot_name}</h3>
                            <p className="text-sm text-slate-500 flex items-center mt-1">
                                <MapPin className="w-3 h-3 mr-1" /> {booking.address}
                            </p>
                        </div>
                        <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-600" : ""}>
                            {booking.status}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-4">
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{format(start, "HH:mm")} - {format(end, "HH:mm")}</span>
                        </div>
                        {booking.amount && <div className="font-medium">₹{booking.amount}</div>}
                    </div>
                </div>

                {/* Action */}
                <div className="p-4 flex items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-100 sm:w-40">
                    {isActive && booking.status === "CONFIRMED" && booking.qr_code_data ? (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                                    <QrCode className="w-4 h-4 mr-2" /> Show QR
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xs flex flex-col items-center text-center p-8">
                                <DialogHeader><DialogTitle>Entry Pass</DialogTitle></DialogHeader>
                                <div className="p-4 bg-white rounded-xl border-4 border-slate-900 shadow-xl">
                                    <QRCode value={booking.qr_code_data} size={180} />
                                </div>
                                <p className="text-sm text-slate-500 mt-6 font-mono font-bold">ID: {booking.id.slice(0, 8).toUpperCase()}</p>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        // Past Booking Actions
                        booking.status === "COMPLETED" || booking.status === "CONFIRMED" ? (
                            <>
                                <Button variant="outline" className="w-full" onClick={() => setShowReview(true)}>
                                    Rate Spot
                                </Button>
                                <WriteReviewModal
                                    isOpen={showReview}
                                    onClose={() => setShowReview(false)}
                                    bookingId={booking.id}
                                    onSuccess={() => toast.success("Thanks for your feedback!")}
                                />
                            </>
                        ) : (
                            <Button variant="ghost" disabled>Cancelled</Button>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
