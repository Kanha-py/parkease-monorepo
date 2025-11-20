"use client";

import { usePathname, useRouter } from "next/navigation";
import {
    User,
    Shield,
    CreditCard,
    Bell,
    Eye,
    Globe,
    FileText,
    Mail,
    X,
    Briefcase,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";

interface AccountLayoutProps {
    children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const isEmailConfirmed = user?.email?.includes("verified") || false;
    const showEmailConfirmation = user && user.email && !isEmailConfirmed;

    const sidebarItems = [
        {
            title: "Personal info",
            href: "/account/personal-info",
            icon: User
        },
        {
            title: "Login & security",
            href: "/account/login-security",
            icon: Shield
        },
        {
            title: "Payments & payouts",
            href: "/account/payments",
            icon: CreditCard
        },
        {
            title: "Taxes",
            href: "/account/taxes",
            icon: FileText
        },
        {
            title: "Notifications",
            href: "/account/notifications",
            icon: Bell
        },
        {
            title: "Privacy & sharing",
            href: "/account/privacy",
            icon: Eye
        },
        {
            title: "Global preferences",
            href: "/account/preferences",
            icon: Globe
        },
        {
            title: "Professional hosting tools",
            href: "/hosting",
            icon: Briefcase
        },
    ];

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50"> {/* Consistent Neutral Background */}
            <header className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-50">
                <div className="container mx-auto max-w-6xl flex items-center justify-between">
                    {/* BRANDING FIX: Use slate-900 instead of red-500 */}
                    <button onClick={() => router.push("/")} className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">P</span>
                        </div>
                        ParkEase
                    </button>
                </div>
            </header>

            <div className="container mx-auto py-10 px-6 max-w-6xl">
                <div className="flex flex-col md:flex-row gap-12">

                    {/* --- LEFT COLUMN: Sidebar --- */}
                    <aside className="w-full md:w-72 flex-shrink-0 space-y-6">

                        {/* Email Alert: Standard Warning Colors (Yellow/Amber) are UX Safe */}
                        {showEmailConfirmation && (
                            <div className="mb-6 p-4 bg-white border border-amber-200 rounded-xl shadow-sm relative overflow-hidden">
                                <div className="flex gap-3">
                                    <div className="mt-1 text-amber-600">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 text-sm">Confirm your email</h3>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Check your inbox to complete your account setup.
                                        </p>
                                        <Button variant="outline" size="sm" className="mt-3 h-8 text-xs font-semibold border-slate-200 hover:bg-slate-50">
                                            Resend email
                                        </Button>
                                    </div>
                                </div>
                                <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-600">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <nav className="space-y-1">
                            {sidebarItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <button
                                        key={item.href}
                                        onClick={() => router.push(item.href)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 text-[15px] font-medium rounded-lg transition-all",
                                            isActive
                                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" // Active State: Clean White Card look
                                                : "text-slate-600 hover:bg-white/50 hover:text-slate-900" // Inactive: Subtle hover
                                        )}
                                    >
                                        <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-slate-900" : "text-slate-400")} />
                                        {item.title}
                                    </button>
                                );
                            })}

                            <div className="my-4 h-[1px] bg-slate-200 mx-4 opacity-50" />

                            <button
                                onClick={() => { logout(); router.push("/"); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            >
                                <LogOut className="w-[18px] h-[18px]" />
                                Log out
                            </button>
                        </nav>
                    </aside>

                    {/* --- RIGHT COLUMN: Main Content --- */}
                    <main className="flex-1 min-w-0">
                        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 min-h-[600px]">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
