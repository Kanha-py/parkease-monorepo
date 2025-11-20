"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/auth/LoginModal";
import {
  User,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Calendar,
  Settings,
  Building2,
  LogIn,
  UserPlus,
  Menu,
  HelpCircle
} from "lucide-react";

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const handleAuthClick = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const isSeller = user?.role === "SELLER_C2B" || user?.role === "OPERATOR_B2B";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full h-11 px-2 pl-3 border-slate-200 hover:shadow-md transition-shadow flex items-center gap-2 bg-white"
          >
            <Menu className="w-5 h-5 text-slate-600" />
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profile_picture_url} alt={user?.name} className="object-cover" />
              <AvatarFallback className="bg-slate-500 text-white font-bold text-xs">
                {user ? initials : <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64 mt-2 p-2" align="end" forceMount>

          {user ? (
            <>
              {/* LOGGED IN VIEW */}
              <DropdownMenuLabel className="font-normal pb-2 px-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-slate-900">{user.name}</p>
                  <p className="text-xs leading-none text-slate-500 truncate">{user.email || user.phone}</p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => router.push("/bookings")} className="cursor-pointer py-2.5">
                <Calendar className="mr-3 h-4 w-4 text-slate-500" />
                <span>My Bookings</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer py-2.5">
                <User className="mr-3 h-4 w-4 text-slate-500" />
                <span>View Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push("/account")} className="cursor-pointer py-2.5">
                <Settings className="mr-3 h-4 w-4 text-slate-500" />
                <span>Account Settings</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push("/account/payments")} className="cursor-pointer py-2.5">
                <CreditCard className="mr-3 h-4 w-4 text-slate-500" />
                <span>Payments</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isSeller ? (
                <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer py-2.5 bg-slate-50 font-medium text-slate-900 focus:bg-slate-100">
                    <LayoutDashboard className="mr-3 h-4 w-4 text-blue-600" />
                    <span>Seller Dashboard</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => router.push("/list-spot")} className="cursor-pointer py-2.5 text-blue-600 focus:text-blue-700">
                    <Building2 className="mr-3 h-4 w-4" />
                    <span>List your space</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 py-2.5">
                <LogOut className="mr-3 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {/* LOGGED OUT VIEW (Now uses consistent styling) */}
              <DropdownMenuItem onClick={() => handleAuthClick("login")} className="cursor-pointer py-2.5 font-semibold">
                <LogIn className="mr-3 h-4 w-4 text-slate-500" />
                <span>Log in</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleAuthClick("signup")} className="cursor-pointer py-2.5">
                <UserPlus className="mr-3 h-4 w-4 text-slate-500" />
                <span>Sign up</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => router.push("/list-spot")} className="cursor-pointer py-2.5">
                <Building2 className="mr-3 h-4 w-4 text-slate-500" />
                <span>Host your home</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push("/help")} className="cursor-pointer py-2.5">
                <HelpCircle className="mr-3 h-4 w-4 text-slate-500" />
                <span>Help Center</span>
              </DropdownMenuItem>
            </>
          )}

        </DropdownMenuContent>
      </DropdownMenu>

      <LoginModal
        isOpen={isAuthModalOpen}
        onOpenChange={setAuthModalOpen}
      />
    </>
  );
}
