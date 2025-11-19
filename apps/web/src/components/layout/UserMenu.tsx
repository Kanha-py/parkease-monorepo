"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, UserCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { LoginModal } from "@/components/auth/LoginModal";

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  // State to trigger specific flows in LoginModal
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const handleAuthClick = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setIsOpen(false); // Close menu
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push("/");
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full h-10 px-2 pl-3 border-slate-200 hover:shadow-md transition-shadow flex items-center gap-2"
          >
            <Menu className="w-4 h-4 text-slate-600" />
            <div className="bg-slate-500 rounded-full text-white p-0.5">
                <UserCircle className="w-6 h-6 fill-current text-slate-300 bg-slate-500 rounded-full" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60 p-0 rounded-xl shadow-xl border-slate-100">
          <div className="flex flex-col py-2">
            {user ? (
              <>
                 {/* LOGGED IN VIEW */}
                <div className="px-4 py-2 text-sm font-semibold text-slate-800 border-b mb-2">
                    Hello, {user.name.split(" ")[0]}
                </div>
                <MenuItem onClick={() => router.push("/dashboard")} label="My Dashboard" />
                <MenuItem onClick={() => router.push("/bookings")} label="My Bookings" />
                <MenuItem onClick={() => router.push("/list-spot")} label="List your spot" />
                <div className="h-[1px] bg-slate-100 my-2" />
                <MenuItem onClick={() => router.push("/profile")} label="Account" />
                <MenuItem onClick={handleLogout} label="Log out" />
              </>
            ) : (
              <>
                {/* LOGGED OUT VIEW (Airbnb Style) */}
                <MenuItem onClick={() => handleAuthClick("login")} label="Log in" bold />
                <MenuItem onClick={() => handleAuthClick("signup")} label="Sign up" />
                <div className="h-[1px] bg-slate-100 my-2" />
                <MenuItem onClick={() => router.push("/list-spot")} label="List your spot" />
                <MenuItem onClick={() => router.push("/help")} label="Help Center" />
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* The Modal is now controlled by the Menu */}
      <LoginModal
        isOpen={isAuthModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode={authMode}
      />
    </>
  );
}

function MenuItem({ onClick, label, bold = false }: { onClick: () => void; label: string; bold?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${bold ? 'font-semibold text-slate-800' : 'text-slate-600'}`}
        >
            {label}
        </button>
    )
}
