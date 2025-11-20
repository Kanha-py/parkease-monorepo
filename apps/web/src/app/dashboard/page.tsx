"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { getMyLots, LotDetails } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  MapPin,
  TrendingUp,
  Users,
  Wallet,
  QrCode,
  ArrowRight,
  Settings
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [lots, setLots] = useState<LotDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (_hasHydrated && !user) {
      router.push("/");
      return;
    }

    const fetchLots = async () => {
      try {
        const data = await getMyLots();
        setLots(data);
      } catch (e) {
        toast.error("Failed to load inventory");
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, [user, _hasHydrated, router]);

  if (!_hasHydrated || !user) return null;

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Seller Dashboard</h1>
              <p className="text-slate-500 mt-1">Welcome back, {user.name}. Here's what's happening today.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push("/scan")} className="h-11 gap-2 bg-white">
                <QrCode className="w-4 h-4" /> Scan Entry
              </Button>
              <Button onClick={() => router.push("/list-spot")} className="h-11 gap-2 bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20">
                <Plus className="w-4 h-4" /> Add New Spot
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 mt-8">

        {/* 1. Stats Row (Mock Data for MVP) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatsCard
            icon={<Wallet className="w-6 h-6 text-green-600" />}
            label="Total Earnings"
            value="₹12,450"
            trend="+12% this week"
          />
          <StatsCard
            icon={<Users className="w-6 h-6 text-blue-600" />}
            label="Total Bookings"
            value="48"
            trend="+5 new today"
          />
          <StatsCard
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            label="Occupancy Rate"
            value="82%"
            trend="High demand"
          />
        </div>

        {/* 2. Inventory Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Your Spots</h2>
          {lots.length > 0 && (
            <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border shadow-sm">
              {lots.length} Active Listings
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
          </div>
        ) : lots.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No spots listed yet</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">Start earning by listing your driveway or parking space. It only takes a few minutes.</p>
            <Button onClick={() => router.push("/list-spot")} size="lg">List Your First Spot</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {lots.map((lot) => (
              <Card key={lot.id} className="group hover:shadow-md transition-all duration-300 border-slate-200">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className="h-16 w-16 bg-slate-100 rounded-xl flex items-center justify-center text-3xl shadow-inner">
                      🅿️
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {lot.name}
                      </h3>
                      <p className="text-slate-500 text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {lot.address}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-md">Active</span>
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">Instant Book</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                    <Button variant="outline" asChild className="flex-1 md:flex-none h-10">
                      <Link href={`/dashboard/${lot.id}`}>
                        <Settings className="w-4 h-4 mr-2" /> Manage Rates
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900">
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatsCard({ icon, label, value, trend }: { icon: any, label: string, value: string, trend: string }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
            {icon}
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-0.5">{label}</p>
            <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
            <p className="text-xs text-green-600 font-medium mt-1.5">{trend}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
