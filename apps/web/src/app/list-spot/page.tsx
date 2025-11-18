"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { createLot } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ListSpotPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [spotType, setSpotType] = useState<"CAR" | "TWO_WHEELER">("CAR");

  // 1. Wait for Mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Protect Route
  useEffect(() => {
    if (isMounted && !user) {
      toast.error("You must be logged in to list a spot.");
      router.push("/");
    }
  }, [isMounted, user, router]);

  const handleSubmit = async () => {
    if (!name || !address) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await createLot({
        name,
        address,
        spot_type: spotType,
        amenities: [],
      });
      toast.success("Spot created successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create spot.");
    } finally {
      setLoading(false);
    }
  };

  // Prevent render until hydration is complete
  if (!isMounted) return null;
  if (!user) return null;

  return (
    <main className="container mx-auto max-w-md py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">List Your Spot</h1>
      <div className="space-y-6 border p-6 rounded-lg shadow-sm bg-white">

        <div className="grid gap-2">
          <Label htmlFor="name">Spot Name</Label>
          <Input
            id="name"
            placeholder="e.g. Priya's Driveway"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address">Full Address</Label>
          <Textarea
            id="address"
            placeholder="e.g. 123 Main St, Bandra West, Mumbai"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            We use Google Maps to find this location. Be specific!
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Vehicle Type</Label>
          <Select value={spotType} onValueChange={(val: any) => setSpotType(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CAR">Car</SelectItem>
              <SelectItem value="TWO_WHEELER">Two Wheeler</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating..." : "Create Listing"}
        </Button>
      </div>
    </main>
  );
}
