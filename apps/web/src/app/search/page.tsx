"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";
import { useAuthStore } from "@/store/useAuthStore";
import { searchParking, createBooking, SearchResult } from "@/lib/api";
import { loadRazorpayScript } from "@/lib/razorpay"; // <--- Import new utility
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const libraries: ("places")[] = ["places"];

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
          lat,
          long,
          start_time: searchParams.get("start") || "",
          end_time: searchParams.get("end") || "",
          radius_meters: 20000,
        });
        setResults(data);
      } catch (error) {
        console.error(error);
        toast.error("Search failed.");
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
      // 1. Load Razorpay SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Razorpay SDK failed to load. Check your connection.");
        setBookingLoading(null);
        return;
      }

      // 2. Create Order on Backend
      const order = await createBooking({
        lot_id: lotId,
        start_time: searchParams.get("start") || "",
        end_time: searchParams.get("end") || "",
      });

      // 3. Open Native Razorpay Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy",
        amount: order.amount * 100,
        currency: order.currency,
        name: "ParkEase",
        description: "Parking Fee",
        order_id: order.razorpay_order_id,
        handler: function (response: any) {
          toast.success("Payment Successful!");
          console.log("Payment ID:", response.razorpay_payment_id);
          // Redirect to Dashboard or Success Page
          router.push("/dashboard");
        },
        prefill: {
          name: user.name,
          contact: user.phone,
        },
        theme: {
          color: "#0F172A",
        },
      };

      // Access the window object directly
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        toast.error("Payment Failed: " + response.error.description);
      });
      rzp1.open();

    } catch (error) {
      console.error(error);
      toast.error("Booking failed. Spot might be taken.");
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
                <p className="text-sm text-muted-foreground mb-3">{lot.address}</p>
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
            <div className="text-center p-8 text-gray-500">
              No spots found near this location for your selected time.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE */}
      <div className="w-full md:w-2/3">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={14}
            options={{ disableDefaultUI: true, zoomControl: true }}
          >
            <MarkerF position={center} title="You are here" />
            {results.map((lot) => (
              <MarkerF
                key={lot.lot_id}
                position={{ lat: lot.latitude, lng: lot.longitude }}
                title={`₹${lot.price}`}
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
    <Suspense fallback={<div className="p-10 text-center">Loading Search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
