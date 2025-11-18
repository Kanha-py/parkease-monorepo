"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getLotDetails, setSpotPricing, setSpotAvailability, LotDetails } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { PricingRulesManager } from "@/components/dashboard/PricingRulesManager";

export default function ManageSpotPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [lot, setLot] = useState<LotDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Pricing State
  const [rate, setRate] = useState("50");

  // Availability State
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  useEffect(() => {
    if (!user) return;
    const fetchLot = async () => {
      try {
        const data = await getLotDetails(params.id as string);
        setLot(data);
      } catch (error) {
        toast.error("Could not load spot.");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchLot();
  }, [params.id, user, router]);

  const handleSavePrice = async () => {
    if (!lot) return;
    try {
      await setSpotPricing(lot.id, parseFloat(rate));
      toast.success(`Price updated to ₹${rate}/hr`);
    } catch (e) {
      toast.error("Failed to update price.");
    }
  };

  const handleAddAvailability = async () => {
    if (!lot || !date || !lot.spots[0]) return;

    // Combine date and time
    const start = new Date(date);
    const [startH, startM] = startTime.split(":");
    start.setHours(parseInt(startH), parseInt(startM));

    const end = new Date(date);
    const [endH, endM] = endTime.split(":");
    end.setHours(parseInt(endH), parseInt(endM));

    try {
      await setSpotAvailability(lot.spots[0].id, start, end);
      toast.success("Availability added!", {
        description: `${format(date, 'MMM dd')} : ${startTime} - ${endTime}`
      });
    } catch (e) {
      toast.error("Failed to add availability.");
    }
  };

  if (loading || !lot) return <div className="p-8">Loading...</div>;

  return (
    <main className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{lot.name}</h1>
        <p className="text-muted-foreground">{lot.address}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* --- PRICING CARD --- */}
        <Card>
          <CardContent className="pt-6">
             <PricingRulesManager lotId={lot.id} />
          </CardContent>
        </Card>

        {/* --- AVAILABILITY CARD --- */}
        <Card>
          <CardHeader><CardTitle>Add Availability</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center border rounded-md p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Time</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>End Time</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleAddAvailability} className="w-full" variant="secondary">
              Add Time Window
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
