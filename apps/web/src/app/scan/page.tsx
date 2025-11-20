// apps/web/src/app/scan/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { scanQRCode } from "@/lib/api";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();

  const [result, setResult] = useState<{ success: boolean, msg: string, driver?: string } | null>(null);
  const [paused, setPaused] = useState(false);

  // Protect Route
  useEffect(() => {
    if (_hasHydrated) {
      if (!user) {
        router.push("/");
      } else if (user.role === "DRIVER") {
        toast.error("Access Denied. Seller account required.");
        router.push("/dashboard");
      }
    }
  }, [_hasHydrated, user, router]);

  const handleScan = async (detectedCodes: any[]) => {
    if (paused || detectedCodes.length === 0) return;

    const rawValue = detectedCodes[0].rawValue;
    setPaused(true); // Stop scanning immediately

    try {
      const data = await scanQRCode(rawValue);

      setResult({
        success: data.success,
        msg: data.message,
        driver: data.driver_name
      });

      if (data.success) {
        toast.success("VERIFIED ✅");
        // Optional: Play success sound
      } else {
        toast.error("INVALID ❌");
        // Optional: Play error sound
      }

    } catch (error: any) {
      setResult({
        success: false,
        msg: error.response?.data?.detail || "Scan Failed"
      });
      toast.error("Scan Error");
    }
  };

  const resetScan = () => {
    setResult(null);
    setPaused(false);
  };

  if (!_hasHydrated || !user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <main className="container mx-auto py-8 px-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Entry Scanner</h1>

      <div className="bg-black rounded-2xl overflow-hidden aspect-square relative shadow-2xl border-4 border-slate-900">
        {!paused ? (
          <Scanner
            onScan={handleScan}
            components={{ audio: false, onOff: true }}
            styles={{ container: { height: '100%' } }}
          />
        ) : (
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200 ${result?.success ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            <h2 className="text-4xl font-extrabold mb-2 tracking-tight">
              {result?.success ? "VERIFIED" : "INVALID"}
            </h2>
            <p className="text-xl font-medium opacity-90">{result?.msg}</p>

            {result?.driver && (
              <div className="mt-6 bg-white/20 backdrop-blur-sm p-4 rounded-xl w-full">
                <p className="text-xs uppercase tracking-wider opacity-75 mb-1">Driver Name</p>
                <p className="text-2xl font-bold">{result.driver}</p>
              </div>
            )}
          </div>
        )}

        {/* Overlay Guide */}
        {!paused && (
          <div className="absolute inset-0 border-2 border-white/30 rounded-2xl pointer-events-none m-12">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white"></div>
          </div>
        )}
      </div>

      {paused && (
        <Button className="w-full mt-6 h-14 text-lg font-bold rounded-xl shadow-lg" onClick={resetScan}>
          Scan Next Vehicle
        </Button>
      )}

      <p className="text-center text-sm text-slate-400 mt-8">
        Point camera at the driver's QR code.
      </p>
    </main>
  );
}
