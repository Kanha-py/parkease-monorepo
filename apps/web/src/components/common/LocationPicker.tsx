"use client";

import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { useState, useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  isLoaded: boolean;
  center?: { lat: number, lng: number };
}

export default function LocationPicker({
  onLocationSelect,
  initialLat = 19.0760,
  initialLng = 72.8777,
  isLoaded,
  center: externalCenter
}: LocationPickerProps) {

  const [internalCenter, setInternalCenter] = useState({ lat: initialLat, lng: initialLng });

  // Fix: Only update internal view when parent prop changes.
  // Do NOT call onLocationSelect here (breaks infinite loop).
  useEffect(() => {
    if (externalCenter) {
      setInternalCenter(externalCenter);
    }
  }, [externalCenter]);

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      // Only call parent update on USER INTERACTION
      onLocationSelect(lat, lng);
    }
  };

  const mapOptions = useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
  }), []);

  if (!isLoaded) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200">
        <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="animate-spin w-6 h-6" />
            <span className="text-sm">Loading Map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-300 relative shadow-inner">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={internalCenter}
        zoom={15}
        options={mapOptions}
        onClick={onMarkerDragEnd}
      >
        <MarkerF
          position={internalCenter}
          draggable={true}
          onDragEnd={onMarkerDragEnd}
          title="Your Spot Location"
        />
      </GoogleMap>
      <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
        <span className="bg-slate-900/80 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg">
            📍 Drag pin to exact gate location
        </span>
      </div>
    </div>
  );
}
