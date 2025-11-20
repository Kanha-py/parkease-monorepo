// apps/web/src/app/hosting/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getMyLots, Lot, getPayoutAccount } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// FIXED: Added Loader2 import
import { Plus, IndianRupee, Settings, TrendingUp, Calendar, Loader2 } from "lucide-react";

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

        {/* 1. Stats / Earnings (Polished) */}
        <Card className="md:col-span-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-800 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl" />
            <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <p className="text-slate-400 font-medium flex items-center gap-2">
                           <TrendingUp className="w-4 h-4" /> Total Earnings (Lifetime)
                        </p>
                        <p className="text-5xl font-bold tracking-tight">₹0.00</p>
                        <p className="text-sm text-slate-400 mt-2">
                           Your next payout is scheduled for <span className="text-white font-bold">Monday</span>.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="text-white bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-sm">
                            <Calendar className="w-4 h-4 mr-2" /> History
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white border-none">
                            Withdraw Funds
                        </Button>
                    </div>
                </div>
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
                        <p className="text-xs font-normal mt-1 text-green-600">Payouts are processed automatically.</p>
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
                <Button variant="ghost" className="w-full justify-start px-2 text-slate-600">Calendar & Availability</Button>
                <Button variant="ghost" className="w-full justify-start px-2 text-slate-600">Pricing Rules</Button>
                <Button variant="ghost" className="w-full justify-start px-2 text-slate-600">Scan QR Code</Button>
            </CardContent>
        </Card>

        {/* 4. My Listings */}
        <div className="md:col-span-3">
             <h2 className="text-xl font-semibold mb-4">Your Spots ({lots.length})</h2>
             {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
             ) : lots.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
                    <div className="mx-auto h-12 w-12 text-slate-300 mb-4">
                        <Plus className="w-12 h-12" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No listings yet</h3>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">Earn money by renting out your unused parking space to drivers nearby.</p>
                    <Button onClick={() => router.push("/list-spot")}>Create your first listing</Button>
                </div>
             ) : (
                <div className="grid md:grid-cols-3 gap-6">
                    {lots.map((lot) => (
                        <Card key={lot.id} className="cursor-pointer hover:border-blue-500 transition-all hover:shadow-md group" onClick={() => router.push(`/dashboard/${lot.id}`)}>
                            <div className="h-40 bg-slate-100 rounded-t-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 transition-colors relative overflow-hidden">
                                <span className="text-sm font-medium relative z-10">Parking Spot Image</span>
                                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:16px_16px]" />
                            </div>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold truncate pr-2">{lot.name}</h3>
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Active</span>
                                </div>
                                <p className="text-sm text-slate-500 truncate mb-4 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-slate-400" />
                                    {lot.address}
                                </p>
                                <div className="text-xs text-slate-400 font-mono">ID: {lot.id.slice(0, 8)}...</div>
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
