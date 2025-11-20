"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  UserCircle,
  LogOut,
  User,
  HelpCircle,
  Car,
  CalendarDays,
  Building2,
  PlusCircle,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Settings
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { LoginModal } from "@/components/auth/LoginModal";

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  // Auth Modal State
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const isSeller = user?.role === "SELLER_C2B" || user?.role === "OPERATOR_B2B";

  const handleAuthClick = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setIsOpen(false);
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
            className="rounded-full h-11 px-2 pl-3 border-slate-200 hover:shadow-md transition-shadow flex items-center gap-2 bg-white"
          >
            <Menu className="w-5 h-5 text-slate-600" />
            <div className="bg-slate-500 rounded-full text-white p-0.5">
               {user?.profile_picture_url ? (
                   <img src={user.profile_picture_url} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
               ) : (
                   <UserCircle className="w-7 h-7 fill-current text-slate-300 bg-slate-500 rounded-full" />
               )}
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-72 p-2 rounded-2xl shadow-xl border-slate-100 mt-2">
          <div className="flex flex-col">
            {user ? (
              <>
                {/* HEADER */}
                <div className="px-4 py-3 mb-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{user.email || user.phone}</p>
                </div>

                {/* DRIVER SECTION */}
                <div className="px-2 pb-2">
                    <MenuLabel>Driving</MenuLabel>
                    <MenuItem
                        onClick={() => router.push("/dashboard")}
                        icon={LayoutDashboard}
                        label="Driver Dashboard"
                    />
                    <MenuItem
                        onClick={() => router.push("/bookings")}
                        icon={CalendarDays}
                        label="My Bookings"
                    />
                </div>

                <MenuDivider />

                {/* SELLER SECTION */}
                <div className="px-2 py-2">
                    {isSeller ? (
                        <>
                            <MenuLabel>Hosting</MenuLabel>
                            <MenuItem
                                onClick={() => router.push("/hosting")}
                                icon={Building2}
                                label="Manage Listings"
                                highlight
                            />
                            <MenuItem
                                onClick={() => router.push("/list-spot")}
                                icon={PlusCircle}
                                label="List a new spot"
                            />
                        </>
                    ) : (
                        <MenuItem
                            onClick={() => router.push("/list-spot")}
                            icon={Building2}
                            label="Become a Seller"
                        />
                    )}
                </div>

                <MenuDivider />

                {/* ACCOUNT SECTION */}
                <div className="px-2 pt-2">
                    {/* Link to the new Account Layout */}
                    <MenuItem
                        onClick={() => router.push("/account")}
                        icon={Settings}
                        label="Account"
                    />
                    {/* Direct Link to Public Profile */}
                    <MenuItem
                        onClick={() => router.push("/profile")}
                        icon={User}
                        label="View/Edit Profile"
                    />
                    <MenuItem
                        onClick={() => router.push("/help")}
                        icon={HelpCircle}
                        label="Help Center"
                    />
                    <MenuItem
                        onClick={handleLogout}
                        icon={LogOut}
                        label="Log out"
                        danger
                    />
                </div>
              </>
            ) : (
              <>
                {/* LOGGED OUT VIEW */}
                <div className="px-2 py-2">
                    <MenuItem
                        onClick={() => handleAuthClick("login")}
                        icon={LogIn}
                        label="Log in"
                        highlight
                    />
                    <MenuItem
                        onClick={() => handleAuthClick("signup")}
                        icon={UserPlus}
                        label="Sign up"
                    />
                </div>

                <MenuDivider />

                <div className="px-2 pt-2">
                    <MenuItem
                        onClick={() => router.push("/list-spot")}
                        icon={Building2}
                        label="Host your home"
                    />
                    <MenuItem
                        onClick={() => router.push("/help")}
                        icon={HelpCircle}
                        label="Help Center"
                    />
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <LoginModal
        isOpen={isAuthModalOpen}
        onOpenChange={setAuthModalOpen}
      />
    </>
  );
}

// --- Sub-components for styling ---

function MenuItem({
    onClick,
    label,
    icon: Icon,
    highlight = false,
    danger = false
}: {
    onClick: () => void;
    label: string;
    icon: any;
    highlight?: boolean;
    danger?: boolean;
}) {
    return (
        <button
            onClick={() => { onClick(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors
                ${highlight ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                ${danger ? 'text-red-600 hover:bg-red-50 hover:text-red-700' : ''}
            `}
        >
            <Icon className={`w-4 h-4 ${highlight ? 'text-slate-900' : 'text-slate-500'} ${danger ? 'text-red-500' : ''}`} />
            {label}
        </button>
    )
}

function MenuDivider() {
    return <div className="h-[1px] bg-slate-100 mx-2 my-1" />
}

function MenuLabel({ children }: { children: React.ReactNode }) {
    return <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{children}</p>
}
