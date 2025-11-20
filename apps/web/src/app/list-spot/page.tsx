"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { createLot, getPayoutAccount, setupPayoutAccount } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useLoadScript } from "@react-google-maps/api";
import LocationPicker from "@/components/common/LocationPicker";
import { PlacesAutocomplete } from "@/components/search/PlacesAutocomplete";
import { toast } from "sonner";
import {
  Loader2,
  IndianRupee,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Car,
  CheckCircle2
} from "lucide-react";

const LIBRARIES: ("places")[] = ["places"];

export default function ListSpotPage() {
  const router = useRouter();
  const { user, _hasHydrated, setAuth, token } = useAuthStore();

  // 0: Loading, 1: Payout, 2: Details
  const [step, setStep] = useState(0);

  // Maps API
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
    id: "google-map-list-spot"
  });

  // Form State
  const [upiId, setUpiId] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState({ lat: 19.0760, lng: 72.8777 }); // Default Mumbai
  const [loading, setLoading] = useState(false);

  // Check User & Payout Status
  useEffect(() => {
    if (_hasHydrated && user) {
        getPayoutAccount().then((account) => {
            setStep(account ? 2 : 1);
        });
    } else if (_hasHydrated && !user) {
        router.push("/");
    }
  }, [user, _hasHydrated, router]);

  // --- Handlers ---

  const handlePayoutSubmit = async () => {
      if (!upiId.includes("@")) {
          toast.error("Invalid UPI ID. Must contain '@'");
          return;
      }
      setPayoutLoading(true);
      try {
          await setupPayoutAccount(upiId);
          // Upgrade local role immediately
          if (user && token) setAuth(token, { ...user, role: "SELLER_C2B" });

          toast.success("Payout account verified ✅");
          setStep(2);
      } catch (e) {
          toast.error("Failed to link account.");
      } finally {
          setPayoutLoading(false);
      }
  };

  const handleLotSubmit = async () => {
    if (!name || !address) {
        toast.error("Please fill in all fields");
        return;
    }
    setLoading(true);
    try {
      await createLot({
        name,
        address,
        spot_type: "CAR",
        amenities: [],
        latitude: coords.lat,
        longitude: coords.lng,
      });
      toast.success("Spot live! Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (error) {
        toast.error("Failed to list spot.");
    } finally {
        setLoading(false);
    }
  };

  if (step === 0 || !isLoaded) {
      return (
        <div className="flex h-[80vh] items-center justify-center text-slate-500 gap-3">
            <Loader2 className="animate-spin w-5 h-5" />
            <span className="font-medium">Checking eligibility...</span>
        </div>
      );
  }

  return (
    <main className="min-h-screen bg-slate-50/50 py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* --- Header Section --- */}
        <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-2">
                {step === 1 ? <IndianRupee className="w-6 h-6 text-green-600" /> : <Car className="w-6 h-6 text-blue-600" />}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                {step === 1 ? "Set up payouts" : "List your space"}
            </h1>
            <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
                {step === 1
                    ? "Link your UPI ID to receive weekly earnings directly to your bank."
                    : "Tell us about your spot so drivers can find it easily."}
            </p>
        </div>

        {/* --- Step 1: Payout Setup --- */}
        {step === 1 && (
            <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden">
                    {/* Trust Header */}
                    <div className="bg-slate-900 p-6 text-white">
                        <div className="flex items-center gap-3 mb-1">
                            <ShieldCheck className="w-5 h-5 text-green-400" />
                            <span className="font-bold text-sm uppercase tracking-wider">Bank Grade Security</span>
                        </div>
                        <p className="text-slate-300 text-sm opacity-90">Your payment info is encrypted.</p>
                    </div>

                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-base font-semibold text-slate-900">UPI ID (VPA)</Label>
                            <div className="relative">
                                <Input
                                    placeholder="e.g. rohan@okhdfcbank"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    className="h-12 text-lg bg-slate-50 border-slate-200 focus:bg-white transition-all pl-11"
                                />
                                <div className="absolute left-3 top-3.5 text-slate-400 font-bold">₹</div>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Verified weekly payouts
                            </p>
                        </div>

                        <Button
                            className="w-full h-12 text-lg font-bold bg-slate-900 hover:bg-black text-white shadow-md hover:shadow-lg transition-all"
                            onClick={handlePayoutSubmit}
                            disabled={payoutLoading}
                        >
                            {payoutLoading ? <Loader2 className="animate-spin" /> : "Link & Continue"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* --- Step 2: Lot Details Form --- */}
        {step === 2 && (
            <Card className="border-slate-200 shadow-xl shadow-slate-200/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardContent className="p-8 md:p-10 space-y-10">

                    {/* Section 1: Basics */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">1</span>
                            <h3 className="font-bold text-lg text-slate-900">Basic Details</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-slate-700">Spot Name</Label>
                                <Input
                                    placeholder="e.g. Linking Road Driveway"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-12 bg-slate-50 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700">Address Search</Label>
                                <PlacesAutocomplete
                                    isLoaded={isLoaded}
                                    placeholder="Search street or landmark..."
                                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-900"
                                    onSelect={(lat, lng, addr) => {
                                        setCoords({ lat, lng });
                                        setAddress(addr);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Location */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">2</span>
                                <h3 className="font-bold text-lg text-slate-900">Pinpoint Location</h3>
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                Required
                            </span>
                        </div>

                        <div className="space-y-2">
                            <LocationPicker
                                isLoaded={isLoaded}
                                center={coords}
                                onLocationSelect={(lat, lng) => setCoords({ lat, lng })}
                            />
                            <p className="text-sm text-slate-500 flex items-center gap-2 justify-center pt-2">
                                <MapPin className="w-4 h-4" />
                                Drivers will be navigated to this exact pin.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <Button
                            className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-900/10 rounded-xl transition-all hover:-translate-y-0.5"
                            onClick={handleLotSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin mr-2" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Publish Listing <ArrowRight className="w-5 h-5" />
                                </span>
                            )}
                        </Button>
                    </div>

                </CardContent>
            </Card>
        )}

      </div>
    </main>
  );
}
