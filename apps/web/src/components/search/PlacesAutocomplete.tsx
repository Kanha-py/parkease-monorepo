"use client";

import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface PlacesAutocompleteProps {
  onSelect: (lat: number, lng: number, address: string) => void;
  isLoaded: boolean; // Pass script load status
  className?: string;
  placeholder?: string;
  defaultValue?: string;
}

export function PlacesAutocomplete({
  onSelect,
  isLoaded,
  className,
  placeholder = "Where are you going?",
  defaultValue = ""
}: PlacesAutocompleteProps) {

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
    init,
  } = usePlacesAutocomplete({
    initOnMount: false, // Wait for script to be ready
    debounce: 300,
    defaultValue,
  });

  // Initialize only when the Google Maps script is loaded
  useEffect(() => {
    if (isLoaded) {
      init();
    }
  }, [isLoaded, init]);

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onSelect(lat, lng, address);
    } catch (error) {
      console.error("Geocoding error: ", error);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        <Input
          className={cn(
            "h-12 pl-10 transition-all", // Base styles
            className // Allow overriding styles (e.g. borderless vs bordered)
          )}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
        />
      </div>

      {/* Suggestions Dropdown */}
      {status === "OK" && (
        <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 max-h-60 overflow-y-auto">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors border-b border-slate-50 last:border-0 flex items-center gap-3"
              onClick={() => handleSelect(description)}
            >
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
