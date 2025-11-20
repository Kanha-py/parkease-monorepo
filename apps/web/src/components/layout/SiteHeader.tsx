"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/UserMenu";
import { useAuthStore } from "@/store/useAuthStore";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SiteHeader() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSeller = user?.role === "SELLER_C2B" || user?.role === "OPERATOR_B2B";

  return (
    <header className="w-full py-4 px-6 md:px-12 flex justify-between items-center bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
        <div className="h-9 w-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-xl">P</span>
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">ParkEase</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4">

        {/* Link Logic:
            - Seller? -> Dashboard
            - Driver? -> Become Seller
            - Guest? -> Become Seller (redirects to login via list-spot page)
        */}
        <Link
            href={isSeller ? "/dashboard" : "/list-spot"}
            className="hidden md:block text-sm font-medium text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-full transition-colors"
        >
            {isSeller ? "Switch to Hosting" : "Become a Seller"}
        </Link>

        <div className="hidden md:block text-slate-300 h-6 border-r mx-2"></div>

        <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-600 hover:bg-slate-100"
            onClick={() => toast.info("Settings coming soon!")}
        >
            <Globe className="w-5 h-5" />
        </Button>

        {/* User Menu (Handles Login/Logout/Profile) */}
        <UserMenu />
      </div>
    </header>
  );
}
