"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    User,
    Shield,
    Bell,
    CreditCard,
    FileText,
    Eye
} from "lucide-react";

const items = [
    { href: "/account/personal-info", label: "Personal Info", icon: User },
    { href: "/account/login-security", label: "Login & Security", icon: Shield },
    { href: "/account/payments", label: "Payments & Payouts", icon: CreditCard },
    { href: "/account/notifications", label: "Notifications", icon: Bell },
    { href: "/account/privacy", label: "Privacy & Sharing", icon: Eye },
];

export function AccountSidebar() {
    const pathname = usePathname();

    return (
        <nav className="flex flex-col space-y-1">
            {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                            isActive
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                    >
                        <item.icon className={cn("w-4 h-4", isActive ? "text-slate-300" : "text-slate-400")} />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
