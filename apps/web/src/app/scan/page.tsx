"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { scanQRCode } from "@/lib/api";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [result, setResult] = useState<{success: boolean, msg: string, driver?: string} | null>(null);
  const [paused, setPaused] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // <--- 1. Add State

  // 2. Handle Hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 3. Protect Route (Only run after mount)
  useEffect(() => {
    if (isMounted) {
      if (!user) {
        router.push("/");
      } else if (user.role === "DRIVER") {
        toast.error("Only sellers can access the scanner.");
        router.push("/");
      }
    }
  }, [isMounted, user, router]);

  const handleScan = async (detectedCodes: any[]) => {
    if (paused || detectedCodes.length === 0) return;

    const rawValue = detectedCodes[0].rawValue;
    setScannedData(rawValue);
    setPaused(true);

    try {
      const data = await scanQRCode(rawValue);
      setResult({
        success: data.success,
        msg: data.message,
        driver: data.driver_name
      });

      if (data.success) {
        toast.success("VERIFIED!", { description: `Driver: ${data.driver_name}` });
      } else {
        toast.error("INVALID!", { description: data.message });
      }
    } catch (error: any) {
      setResult({ success: false, msg: "Error: " + (error.response?.data?.detail || "Unknown") });
      toast.error("Scan Failed");
    }
  };

  const resetScan = () => {
    setScannedData(null);
    setResult(null);
    setPaused(false);
  };

  // 4. Prevent Render until mounted
  if (!isMounted || !user) return null;

  return (
    <main className="container mx-auto py-8 px-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Entry Scanner</h1>

      <div className="bg-black rounded-lg overflow-hidden aspect-square relative">
        {!paused ? (
          <Scanner
            onScan={handleScan}
            components={{ audio: false, onOff: true }}
          />
        ) : (
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 ${result?.success ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            <h2 className="text-4xl font-bold mb-2">{result?.success ? "VERIFIED" : "INVALID"}</h2>
            <p className="text-xl">{result?.msg}</p>
            {result?.driver && <p className="mt-4 text-lg font-semibold">Driver: {result.driver}</p>}
          </div>
        )}
      </div>

      {paused && (
        <Button className="w-full mt-6 h-12 text-lg" onClick={resetScan}>
          Scan Next Vehicle
        </Button>
      )}
    </main>
  );
}
