"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoadScript } from "@react-google-maps/api";
import { PlacesAutocomplete } from "./PlacesAutocomplete";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";
import { Search, Loader2 } from "lucide-react";

const LIBRARIES: ("places")[] = ["places"];

function SearchInput() {
  const router = useRouter();

  // State
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");

  const handleSearch = () => {
    const lat = coords?.lat || 19.0760; // Default Mumbai
    const lng = coords?.lng || 72.8777;

    // Construct ISO strings
    const dateStr = date.toISOString().split('T')[0];
    const start = new Date(`${dateStr}T${startTime}:00`);
    const end = new Date(`${dateStr}T${endTime}:00`);

    const params = new URLSearchParams({
      lat: lat.toString(),
      long: lng.toString(),
      start: start.toISOString(),
      end: end.toISOString()
    });

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 w-full max-w-4xl bg-white p-2 rounded-3xl shadow-2xl shadow-blue-900/10 border border-slate-100">

        {/* 1. Location Input (Large) */}
        <div className="flex-1 relative z-20">
            <PlacesAutocomplete
                isLoaded={true} // Parent handles loading
                onSelect={(lat, lng) => setCoords({ lat, lng })}
            />
        </div>

        {/* 2. Date/Time Picker */}
        <div className="flex-shrink-0">
            <DateRangePicker
                date={date} setDate={setDate}
                startTime={startTime} setStartTime={setStartTime}
                endTime={endTime} setEndTime={setEndTime}
            />
        </div>

        {/* 3. Search Button */}
        <Button
            size="lg"
            className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold shadow-lg"
            onClick={handleSearch}
        >
            <Search className="w-5 h-5 mr-2" />
            Search
        </Button>
    </div>
  );
}

// Wrapper
export function SearchBar() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
    id: "google-map-script-bar"
  });

  if (!isLoaded) return <div className="flex items-center gap-2 text-slate-400 p-4"><Loader2 className="animate-spin"/> Loading Maps...</div>;

  return <SearchInput />;
}
