"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import { AccountSidebar } from "@/components/account/AccountSidebar";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !user) {
      router.push("/");
    }
  }, [_hasHydrated, user, router]);

  if (!_hasHydrated || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-[280px_1fr] gap-8 lg:gap-12">

            {/* Left: Sidebar Navigation */}
            <aside className="hidden md:block space-y-6">
                <div>
                    <h2 className="px-4 text-lg font-bold text-slate-900 mb-2">Account Settings</h2>
                    <p className="px-4 text-sm text-slate-500 mb-6">Manage your details and preferences.</p>
                    <AccountSidebar />
                </div>
            </aside>

            {/* Right: Content Area */}
            <main className="min-w-0">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 min-h-[600px]">
                    {children}
                </div>
            </main>

        </div>
      </div>
    </div>
  );
}
