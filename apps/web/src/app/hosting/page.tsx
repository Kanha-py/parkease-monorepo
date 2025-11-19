// apps/web/src/app/hosting/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getMyLots, Lot, getPayoutAccount } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, IndianRupee, Settings } from "lucide-react";

export default function HostingPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutConfigured, setPayoutConfigured] = useState(false);

  // 1. Auth Check & Data Fetch
  useEffect(() => {
    if (_hasHydrated && !user) router.push("/");

    if (user && _hasHydrated) {
      const fetchData = async () => {
        try {
          const [myLots, payout] = await Promise.all([
            getMyLots(),
            getPayoutAccount()
          ]);
          setLots(myLots);
          setPayoutConfigured(!!payout);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, _hasHydrated, router]);

  if (!_hasHydrated || !user) return null;

  return (
    <main className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Hosting Dashboard</h1>
        <Button onClick={() => router.push("/list-spot")}>
            <Plus className="w-4 h-4 mr-2" /> List New Spot
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">

        {/* 1. Stats / Earnings (Placeholder) */}
        <Card className="md:col-span-3 bg-slate-900 text-white border-slate-800">
            <CardContent className="p-8 flex justify-between items-center">
                <div>
                    <p className="text-slate-400 font-medium mb-1">Total Earnings</p>
                    <p className="text-4xl font-bold">₹0.00</p>
                </div>
                <Button variant="outline" className="text-white border-slate-600 hover:bg-slate-800">
                    View Transaction History
                </Button>
            </CardContent>
        </Card>

        {/* 2. Payout Status */}
        <Card className={payoutConfigured ? "bg-green-50 border-green-100" : "bg-yellow-50 border-yellow-100"}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <IndianRupee className="w-5 h-5" /> Payout Method
                </CardTitle>
            </CardHeader>
            <CardContent>
                {payoutConfigured ? (
                    <div className="text-sm text-green-800 font-medium">
                        ✅ Account Linked (UPI)
                        <p className="text-xs font-normal mt-1 text-green-600"> payouts are processed weekly.</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-yellow-800 mb-3">No payout account linked. You cannot receive earnings.</p>
                        <Button size="sm" variant="outline" className="w-full border-yellow-300 hover:bg-yellow-100 text-yellow-900" onClick={() => router.push("/list-spot")}>
                            Setup Now
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* 3. Quick Actions */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" /> Tools
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start px-2">Calendar & Availability</Button>
                <Button variant="ghost" className="w-full justify-start px-2">Pricing Rules</Button>
                <Button variant="ghost" className="w-full justify-start px-2">Scan QR Code</Button>
            </CardContent>
        </Card>

        {/* 4. My Listings */}
        <div className="md:col-span-3">
             <h2 className="text-xl font-semibold mb-4">Your Spots ({lots.length})</h2>
             {loading ? (
                <div className="text-center py-8">Loading...</div>
             ) : lots.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                    <p className="text-slate-500 mb-4">You don't have any active listings.</p>
                    <Button onClick={() => router.push("/list-spot")}>Create your first listing</Button>
                </div>
             ) : (
                <div className="grid md:grid-cols-3 gap-6">
                    {lots.map((lot) => (
                        <Card key={lot.id} className="cursor-pointer hover:border-blue-500 transition-colors group" onClick={() => router.push(`/dashboard/${lot.id}`)}>
                            <div className="h-32 bg-slate-100 rounded-t-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 transition-colors">
                                {/* Placeholder for image */}
                                <span className="text-sm font-medium">No Image</span>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-bold truncate">{lot.name}</h3>
                                <p className="text-sm text-slate-500 truncate mb-4">{lot.address}</p>
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                                    <span className="text-slate-400">ID: {lot.id.slice(0, 6)}...</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
             )}
        </div>

      </div>
    </main>
  );
}
