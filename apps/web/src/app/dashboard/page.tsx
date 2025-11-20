// apps/web/src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { updateUserProfile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Car, Clock, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, _hasHydrated, setAuth } = useAuthStore();

  // Vehicle Setup State
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  // Mounting logic
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (isMounted && _hasHydrated && !user) {
      router.push("/");
    }
  }, [isMounted, _hasHydrated, user, router]);

  const handleSaveVehicle = async () => {
    if(!vehiclePlate) return;
    setIsAddingVehicle(true);
    try {
        // FIXED: password is required by the API schema, sending empty string to bypass hash update
        const updatedUser = await updateUserProfile({
            name: user!.name,
            email: user!.email || "",
            password: "",
            default_vehicle_plate: vehiclePlate
        });

        const token = useAuthStore.getState().token;
        if(token) setAuth(token, updatedUser);
        toast.success("Vehicle added!");
    } catch (e) {
        toast.error("Failed to save vehicle.");
    } finally {
        setIsAddingVehicle(false);
    }
  }

  if (!isMounted || !_hasHydrated || !user) return null;

  return (
    <main className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.name.split(" ")[0]}</h1>
            <p className="text-slate-500">Manage your trips and vehicles.</p>
          </div>
          <Button onClick={() => router.push("/")}>Book a Spot</Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">

        {/* --- 1. Vehicle Section --- */}
        <div className="md:col-span-2 space-y-6">

             {/* Vehicle Card */}
            <Card>
                 <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Car className="w-5 h-5" /> My Vehicle
                    </CardTitle>
                 </CardHeader>
                {!user.default_vehicle_plate ? (
                    <CardContent>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <p className="text-sm text-blue-900 font-medium mb-2">
                                Add your vehicle number for faster bookings.
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. GJ 06 AB 1234"
                                    className="bg-white"
                                    value={vehiclePlate}
                                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                                />
                                <Button onClick={handleSaveVehicle} disabled={isAddingVehicle}>
                                    {isAddingVehicle ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                ) : (
                    <CardContent>
                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Primary Plate</p>
                                <p className="text-2xl font-mono font-bold tracking-wider text-slate-900">{user.default_vehicle_plate}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => toast.info("Edit coming soon")}>Edit</Button>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Current/Upcoming Booking (Placeholder for future) */}
            <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-6 text-center">
                    <Clock className="w-8 h-8 text-blue-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-blue-900">No active bookings</h3>
                    <p className="text-sm text-blue-700 mb-4">Ready to go somewhere?</p>
                    <Button variant="outline" className="bg-white hover:bg-blue-50 text-blue-700 border-blue-200" onClick={() => router.push("/")}>Find Parking</Button>
                </CardContent>
            </Card>

        </div>

        {/* --- 2. Recent History Sidebar --- */}
        <div>
             <h2 className="text-lg font-semibold mb-4">History</h2>
             <div className="space-y-3">
                 {/* Empty State */}
                 <div className="text-center py-8 border rounded-lg bg-slate-50 text-slate-500 text-sm">
                    No past trips.
                 </div>
                 <Button variant="ghost" className="w-full text-slate-500" onClick={() => router.push("/bookings")}>
                    View All History
                 </Button>
             </div>
        </div>

      </div>
    </main>
  );
}
