"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { useAuthStore } from "@/store/useAuthStore";
import { createLot } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const libraries: ("places")[] = ["places"];
const mapContainerStyle = { width: "100%", height: "300px", borderRadius: "8px" };

// --- 1. INNER COMPONENT (Form Logic) ---
function ListSpotForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [spotType, setSpotType] = useState<"CAR" | "TWO_WHEELER">("CAR");

  // Location State
  const [marker, setMarker] = useState({ lat: 19.0760, lng: 72.8777 });
  const [addressText, setAddressText] = useState("");

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  const handleSelectAddress = async (address: string) => {
    setValue(address, false);
    setAddressText(address);
    clearSuggestions();
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setMarker({ lat, lng });
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      toast.info("Location Pin Updated");
    }
  };

  const handleSubmit = async () => {
    if (!name || !addressText) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await createLot({
        name,
        address: addressText,
        spot_type: spotType,
        amenities: [],
        latitude: marker.lat,
        longitude: marker.lng
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

  return (
    <div className="space-y-6 border p-6 rounded-lg shadow-sm bg-white">
      <div className="grid gap-2">
        <Label>Spot Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya's Driveway" />
      </div>

      <div className="grid gap-2 relative">
        <Label>Address Search</Label>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          placeholder="Search area..."
        />
        {status === "OK" && (
          <ul className="absolute z-10 top-full bg-white border mt-1 w-full rounded-md shadow-md max-h-60 overflow-auto">
            {data.map(({ place_id, description }) => (
              <li
                key={place_id}
                onClick={() => handleSelectAddress(description)}
                className="p-2 hover:bg-slate-100 cursor-pointer text-sm"
              >
                {description}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-2">
        <Label>Pin Exact Location (Drag to adjust)</Label>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={marker}
          zoom={15}
          onClick={onMapClick}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          <MarkerF
            position={marker}
            draggable={true}
            onDragEnd={onMarkerDragEnd}
          />
        </GoogleMap>
        <p className="text-xs text-muted-foreground text-center">
          Lat: {marker.lat.toFixed(4)}, Lng: {marker.lng.toFixed(4)}
        </p>
      </div>

      <div className="grid gap-2">
        <Label>Vehicle Type</Label>
        <Select value={spotType} onValueChange={(val: any) => setSpotType(val)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CAR">Car</SelectItem>
            <SelectItem value="TWO_WHEELER">Two Wheeler</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={loading}>
        {loading ? "Creating..." : "Confirm Location & List"}
      </Button>
    </div>
  );
}

// --- 2. WRAPPER COMPONENT (Handles Loading & Hydration) ---
export default function ListSpotPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

  // 1. Handle Hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Protect Route (Only run check AFTER mounted)
  useEffect(() => {
    if (isMounted && !user) {
      router.push("/");
    }
  }, [isMounted, user, router]);

  // 3. Prevent rendering until mounted to avoid redirect loop
  if (!isMounted) return null;
  if (!user) return null; // Will redirect in useEffect

  if (!isLoaded) return <div className="p-10 text-center">Loading Maps...</div>;

  return (
    <main className="container mx-auto max-w-lg py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">List Your Spot</h1>
      <ListSpotForm />
    </main>
  );
}
