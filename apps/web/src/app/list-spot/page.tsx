// apps/web/src/app/list-spot/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { createLot, getPayoutAccount, setupPayoutAccount } from "@/lib/api"; // Ensure these are imported
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, IndianRupee } from "lucide-react";

export default function ListSpotPage() {
  const router = useRouter();
  const { user, _hasHydrated, setAuth, token } = useAuthStore();

  // State: 0 = Loading, 1 = Payout Setup, 2 = Lot Form
  const [step, setStep] = useState(0);

  // Payout State
  const [upiId, setUpiId] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Lot Form State
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // Check Payout Status on Mount
  useEffect(() => {
    if (_hasHydrated && user) {
        getPayoutAccount().then((account) => {
            if (account) {
                setStep(2); // Account exists, go to form
            } else {
                setStep(1); // No account, show setup
            }
        });
    } else if (_hasHydrated && !user) {
        router.push("/"); // Redirect if not logged in
    }
  }, [user, _hasHydrated, router]);

  const handlePayoutSubmit = async () => {
      if (!upiId.includes("@")) {
          toast.error("Invalid UPI ID");
          return;
      }
      setPayoutLoading(true);
      try {
          await setupPayoutAccount(upiId);

          // CRITICAL FIX: Manually upgrade local user role to SELLER_C2B
          // This updates the UI (Menu/Navbar) immediately without a page reload
          if (user && token) {
              setAuth(token, { ...user, role: "SELLER_C2B" });
          }

          toast.success("Payout linked! You are now a Seller.");
          setStep(2);
      } catch (e) {
          toast.error("Failed to link account.");
      } finally {
          setPayoutLoading(false);
      }
  };

  const handleLotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;

    setLoading(true);
    try {
      await createLot({
        name,
        address,
        spot_type: "CAR",
        amenities: [],
        latitude: 19.0760, // Hardcoded for MVP (Mumbai)
        longitude: 72.8777,
      });
      toast.success("Spot listed successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 0) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <main className="container mx-auto py-12 px-4 max-w-2xl">

      {/* STEP 1: PAYOUT SETUP */}
      {step === 1 && (
          <div className="space-y-6">
              <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2">Get Paid</h1>
                  <p className="text-slate-600">Before you list, tell us where to send your earnings.</p>
              </div>

              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <IndianRupee className="w-5 h-5 text-green-600" />
                          Link UPI Account
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="space-y-2">
                          <Label>UPI ID (VPA)</Label>
                          <Input
                            placeholder="e.g. rohan@okicici"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                          />
                      </div>
                      <Button className="w-full" onClick={handlePayoutSubmit} disabled={payoutLoading}>
                          {payoutLoading ? "Linking..." : "Link & Continue"}
                      </Button>
                  </CardContent>
              </Card>
          </div>
      )}

      {/* STEP 2: LOT FORM (Original Form) */}
      {step === 2 && (
        <>
            <h1 className="text-3xl font-bold mb-8">List New Spot</h1>
            <form onSubmit={handleLotSubmit} className="space-y-6 bg-white p-6 rounded-lg border">
                <div className="space-y-2">
                <Label htmlFor="name">Spot Name</Label>
                <Input
                    id="name"
                    placeholder="e.g. Linking Road Driveway"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                </div>

                <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                    id="address"
                    placeholder="Full address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />
                </div>

                <div className="bg-yellow-50 p-4 rounded-md text-sm text-yellow-800">
                    Note: Location is currently auto-set to Mumbai center for this demo.
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Listing"}
                </Button>
            </form>
        </>
      )}
    </main>
  );
}
