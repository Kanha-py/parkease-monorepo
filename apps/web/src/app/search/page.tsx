"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";
import { useAuthStore } from "@/store/useAuthStore";
import { searchParking, createBooking, SearchResult } from "@/lib/api";
import { loadRazorpayScript } from "@/lib/razorpay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const mapContainerStyle = { width: "100%", height: "100vh" };
const libraries: ("places")[] = ["places"];

// Custom Icons (URLs)
const USER_ICON = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
const SPOT_ICON = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

// Helper: Calculate Distance (Haversine Formula)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

  const lat = parseFloat(searchParams.get("lat") || "0");
  const long = parseFloat(searchParams.get("long") || "0");
  const center = { lat, lng: long };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await searchParking({
          lat, long,
          start_time: searchParams.get("start") || "",
          end_time: searchParams.get("end") || "",
          radius_meters: 20000,
        });
        setResults(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (lat && long) fetchResults();
    else setLoading(false);
  }, [lat, long, searchParams]);

  const handleBook = async (lotId: string, price: number) => {
    if (!user) {
      toast.error("Please log in to book a spot.");
      return;
    }
    setBookingLoading(lotId);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) { toast.error("SDK Error"); return; }

      const order = await createBooking({
        lot_id: lotId,
        start_time: searchParams.get("start") || "",
        end_time: searchParams.get("end") || "",
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy",
        amount: order.amount * 100,
        currency: order.currency,
        name: "ParkEase",
        description: "Parking Fee",
        order_id: order.razorpay_order_id,
        handler: function (response: any) {
          toast.success("Payment Successful!");
          router.push("/dashboard");
        },
        prefill: { name: user.name, contact: user.phone },
        theme: { color: "#0F172A" },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (error) {
      toast.error("Booking failed.");
    } finally {
      setBookingLoading(null);
    }
  };

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* LEFT PANE */}
      <div className="w-full md:w-1/3 p-4 overflow-y-auto border-r bg-slate-50">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => router.push("/")}>← Back</Button>
          <h1 className="text-xl font-bold mt-2">
            {loading ? "Searching..." : `${results.length} Spots Found`}
          </h1>
        </div>

        <div className="space-y-4">
          {results.map((lot) => (
            <Card key={lot.lot_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{lot.name}</CardTitle>
                  <span className="font-bold text-green-600">₹{lot.price}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-1">{lot.address}</p>
                {/* Distance Badge */}
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-xs font-medium text-blue-700 mb-3">
                   📍 {getDistanceKm(lat, long, lot.latitude, lot.longitude)} km away
                </div>
                <Button
                  className="w-full size-sm"
                  onClick={() => handleBook(lot.lot_id, lot.price)}
                  disabled={bookingLoading === lot.lot_id}
                >
                  {bookingLoading === lot.lot_id ? "Processing..." : "Book Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
          {!loading && results.length === 0 && (
             <div className="text-center p-8 text-gray-500">No spots found.</div>
          )}
        </div>
      </div>

      {/* RIGHT PANE */}
      <div className="w-full md:w-2/3">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={13}
            options={{ disableDefaultUI: true, zoomControl: true }}
          >
            <MarkerF position={center} icon={USER_ICON} title="You are here" />

            {results.map((lot) => (
              <MarkerF
                key={lot.lot_id}
                position={{ lat: lot.latitude, lng: lot.longitude }}
                icon={SPOT_ICON}
                title={`${lot.name} - ₹${lot.price}`}
                label={{
                  text: `₹${lot.price}`,
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                  className: "bg-black px-1 rounded"
                }}
              />
            ))}
          </GoogleMap>
        ) : (
          <div className="flex items-center justify-center h-full">Loading Map...</div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
