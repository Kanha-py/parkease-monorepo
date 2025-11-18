"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoadScript } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"; // <--- Import Button

const libraries: ("places")[] = ["places"];

// --- 1. Inner Component (Contains Logic) ---
function SearchInput() {
  const router = useRouter();

  // Time State
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [date, setDate] = useState(tomorrow.toISOString().split('T')[0]);

  // Coordinate State (New)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null);

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      // UX FIX: Just store coordinates, don't navigate yet
      setSelectedCoords({ lat, lng });
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  const handleSearchClick = () => {
    if (!selectedCoords) return;

    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);

    const params = new URLSearchParams({
      lat: selectedCoords.lat.toString(),
      long: selectedCoords.lng.toString(),
      start: start.toISOString(),
      end: end.toISOString()
    });

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl border space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

        {/* Location Input */}
        <div className="md:col-span-3 relative">
          <Label>Where to?</Label>
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSelectedCoords(null); // Reset selection if typing
            }}
            disabled={!ready}
            placeholder="Search location (e.g. Phoenix Mall)"
            className="mt-1"
          />
          {status === "OK" && (
            <ul className="absolute z-10 bg-white border mt-1 w-full rounded-md shadow-md max-h-60 overflow-auto">
              {data.map(({ place_id, description }) => (
                <li
                  key={place_id}
                  onClick={() => handleSelect(description)}
                  className="p-2 hover:bg-slate-100 cursor-pointer text-sm"
                >
                  {description}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Time Inputs */}
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Start</Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>End</Label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1" />
        </div>
      </div>

      {/* Search Button (New) */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSearchClick}
        disabled={!selectedCoords} // Disable until location picked
      >
        Find Parking Spots
      </Button>
    </div>
  );
}

// --- 2. Wrapper Component ---
export function SearchBar() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

  if (!isLoaded) return <div className="p-4 text-center">Loading Maps...</div>;

  return <SearchInput />;
}
