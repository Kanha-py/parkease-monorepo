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
import { FilterModal } from "@/components/search/FilterModal"; // <--- Import Filter Modal
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

  // 1. Search State
  const [lat, setLat] = useState(parseFloat(searchParams.get("lat") || "19.0760"));
  const [long, setLong] = useState(parseFloat(searchParams.get("long") || "72.8777"));
  const [date, setDate] = useState(new Date(searchParams.get("start") || new Date()));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");

  // 2. Filter State (NEW)
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 1000,
    cctv: false,
    covered: false,
    instantBook: false
  });

  // 3. Data State
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState<SearchResult | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
    id: "google-map-search-page"
  });

  // --- FETCH RESULTS ---
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const dateStr = date.toISOString().split('T')[0];
        const startISO = new Date(`${dateStr}T${startTime}:00`).toISOString();
        const endISO = new Date(`${dateStr}T${endTime}:00`).toISOString();

        const data = await searchParking({
          lat, long,
          start_time: startISO,
          end_time: endISO,
          vehicle_type: "CAR",
          radius_meters: 5000,
          // Pass Filters to API
          min_price: filters.minPrice,
          max_price: filters.maxPrice,
          has_cctv: filters.cctv,
          has_covered: filters.covered
        });
        setResults(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch spots");
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) fetchResults();
  }, [lat, long, date, startTime, endTime, isLoaded, filters]); // Re-run when filters change


  // --- BOOKING HANDLER ---
  const handleConfirmBooking = async () => {
    if (!selectedLot) return;
    if (!user) {
      toast.error("Please log in to book this spot.");
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
      toast.error("Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (!isLoaded) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">

      {/* --- 1. Filter Bar --- */}
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

        {/* Filter Button */}
        <Button variant="outline" className="ml-auto gap-2 hidden md:flex" onClick={() => setShowFilters(true)}>
          <Filter className="w-4 h-4" /> Filters
          {(filters.cctv || filters.covered || filters.minPrice > 0) && <Badge className="h-2 w-2 rounded-full p-0 bg-blue-600" />}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* --- 2. Results List --- */}
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
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">₹{lot.price}</div>
                    <Badge variant="secondary" className="text-[10px]">
                      {lot.rate_type === "HOURLY" ? "Est. Total" : "Flat Fee"}
                    </Badge>
                  </div>
                </div>
                <Button className="w-full bg-slate-900 hover:bg-black text-white h-9 font-medium mt-2">
                  View & Book
                </Button>
              </CardContent>
            </Card>
          ))}
          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400">
              <p>No spots found matching your filters.</p>
              <Button variant="link" onClick={() => { setLat(19.0760); setLong(72.8777); }}>Reset Map</Button>
            </div>
          )}
        </div>

        {/* --- 3. Map --- */}
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

      {/* Modals */}
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

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
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
