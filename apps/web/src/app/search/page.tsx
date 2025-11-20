"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";
import { useAuthStore } from "@/store/useAuthStore";
import { searchParking, createBooking, SearchResult } from "@/lib/api";
import { loadRazorpayScript } from "@/lib/razorpay";
import { BookingConfirmationModal } from "@/components/booking/BookingConfirmationModal";
import { DateRangePicker } from "@/components/search/DateRangePicker";
import { PlacesAutocomplete } from "@/components/search/PlacesAutocomplete";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Loader2, Filter } from "lucide-react";

const mapContainerStyle = { width: "100%", height: "100%" };
const libraries: ("places")[] = ["places"];
const USER_ICON = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
const SPOT_ICON = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  // Search State (Lifted up for Filter Bar)
  const [lat, setLat] = useState(parseFloat(searchParams.get("lat") || "19.0760"));
  const [long, setLong] = useState(parseFloat(searchParams.get("long") || "72.8777"));
  const [date, setDate] = useState(new Date(searchParams.get("start") || new Date()));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState<SearchResult | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
    id: "google-map-search-page"
  });

  // Fetch Results when filters change
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // Construct ISO strings for API
        const dateStr = date.toISOString().split('T')[0];
        const startISO = new Date(`${dateStr}T${startTime}:00`).toISOString();
        const endISO = new Date(`${dateStr}T${endTime}:00`).toISOString();

        const data = await searchParking({
          lat, long,
          start_time: startISO,
          end_time: endISO,
          vehicle_type: "CAR",
          radius_meters: 5000,
        });
        setResults(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (isLoaded) fetchResults();
  }, [lat, long, date, startTime, endTime, isLoaded]);


  const handleConfirmBooking = async () => {
    if (!selectedLot || !user) {
        if (!user) toast.error("Please log in first");
        return;
    }
    setBookingLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const startISO = new Date(`${dateStr}T${startTime}:00`).toISOString();
      const endISO = new Date(`${dateStr}T${endTime}:00`).toISOString();

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error("Payment SDK failed");

      const order = await createBooking({
        lot_id: selectedLot.lot_id,
        start_time: startISO,
        end_time: endISO,
        vehicle_type: "CAR"
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount * 100,
        currency: order.currency,
        name: "ParkEase",
        description: `Parking at ${selectedLot.name}`,
        order_id: order.razorpay_order_id,
        handler: function (response: any) {
          toast.success("Booking Confirmed! 🎉");
          router.push("/bookings");
        },
        prefill: { name: user.name, contact: user.phone },
        theme: { color: "#0F172A" },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
      setSelectedLot(null);

    } catch (error) {
      toast.error("Booking failed.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (!isLoaded) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]"> {/* Subtract Header Height */}

      {/* --- 1. Filter Bar (Sticky Top) --- */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm flex flex-col md:flex-row items-center gap-4 z-20 relative">
          <div className="w-full md:w-96">
            <PlacesAutocomplete
                isLoaded={isLoaded}
                onSelect={(l, lg) => { setLat(l); setLong(lg); }}
            />
          </div>
          <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
          <DateRangePicker
             date={date} setDate={setDate}
             startTime={startTime} setStartTime={setStartTime}
             endTime={endTime} setEndTime={setEndTime}
          />
          <Button variant="outline" className="ml-auto gap-2 hidden md:flex">
              <Filter className="w-4 h-4" /> Filters
          </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* --- 2. Results List (Left) --- */}
        <div className="w-full md:w-[450px] bg-slate-50 border-r border-slate-200 overflow-y-auto p-4 space-y-4 shadow-inner z-10">
            <div className="flex justify-between items-baseline mb-2 px-1">
                <h2 className="font-bold text-slate-900">{results.length} spots available</h2>
                <span className="text-xs text-slate-500">Sorted by relevance</span>
            </div>

            {results.map((lot) => (
                <Card
                    key={lot.lot_id}
                    className="group cursor-pointer hover:shadow-md transition-all border-slate-200"
                    onClick={() => setSelectedLot(lot)}
                >
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{lot.name}</h3>
                            <p className="text-xs text-slate-500 flex items-center mt-1">
                                <MapPin className="w-3 h-3 mr-1" /> {lot.address}
                            </p>
                        </div>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                            ₹{lot.price}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <Button className="w-full bg-slate-900 hover:bg-black text-white h-9 font-medium">
                            View & Book
                        </Button>
                    </div>
                </CardContent>
                </Card>
            ))}
            {results.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-400">
                    <p>No spots found in this area.</p>
                    <Button variant="link" onClick={() => { setLat(19.0760); setLong(72.8777); }}>Reset Map</Button>
                </div>
            )}
        </div>

        {/* --- 3. Map (Right) --- */}
        <div className="flex-1 relative bg-slate-100">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{ lat, lng: long }}
                zoom={14}
                options={{ disableDefaultUI: true, zoomControl: true, mapTypeControl: false }}
            >
                <MarkerF position={{ lat, lng: long }} icon={USER_ICON} />
                {results.map((lot) => (
                    <MarkerF
                        key={lot.lot_id}
                        position={{ lat: lot.latitude, lng: lot.longitude }}
                        icon={SPOT_ICON}
                        onClick={() => setSelectedLot(lot)}
                    />
                ))}
            </GoogleMap>
        </div>
      </div>

      <BookingConfirmationModal
        isOpen={!!selectedLot}
        onClose={() => setSelectedLot(null)}
        onConfirm={handleConfirmBooking}
        loading={bookingLoading}
        lot={selectedLot}
        startTime={new Date(`${date.toISOString().split('T')[0]}T${startTime}:00`).toISOString()}
        endTime={new Date(`${date.toISOString().split('T')[0]}T${endTime}:00`).toISOString()}
        vehicleType="CAR"
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
