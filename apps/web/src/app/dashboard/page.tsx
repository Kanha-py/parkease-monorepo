"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getMyLots, Lot } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // 1. Handle Hydration (Wait for client-side load)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Protect Route (Only run after mount)
  useEffect(() => {
    if (isMounted && !user) {
      router.push("/");
    }
  }, [isMounted, user, router]);

  // 3. Fetch Data (Only if user exists)
  useEffect(() => {
    if (isMounted && user) {
      const fetchLots = async () => {
        try {
          const data = await getMyLots();
          setLots(data);
        } catch (error) {
          console.error(error);
          // toast.error("Failed to load your spots.");
        } finally {
          setLoading(false);
        }
      };
      fetchLots();
    }
  }, [isMounted, user]);

  // Prevent rendering (and redirecting) until mounted
  if (!isMounted) return null;
  if (!user) return null;

  return (
    <main className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <Button onClick={() => router.push("/list-spot")}>+ List New Spot</Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : lots.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-slate-50">
          <p className="text-lg mb-4">You haven't listed any spots yet.</p>
          <Button onClick={() => router.push("/list-spot")}>Get Started</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lots.map((lot) => (
            <Card
              key={lot.id}
              // --- ADDED: Styling to look clickable ---
              className="cursor-pointer hover:border-primary transition-colors"
              // --- ADDED: Navigation logic ---
              onClick={() => router.push(`/dashboard/${lot.id}`)}
            >
              <CardHeader>
                <CardTitle>{lot.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{lot.address}</p>
                <p className="text-xs text-slate-400">
                  Created: {new Date(lot.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
