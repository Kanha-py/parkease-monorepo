"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    User, Shield, CreditCard, Bell, Eye, Globe, Briefcase, FileText
} from "lucide-react";

export default function AccountOverviewPage() { // Renamed to avoid conflict with /account layout
    const router = useRouter();
    const { user, _hasHydrated } = useAuthStore();

    if (!_hasHydrated || !user) return null;

    const cards = [
        {
            title: "Personal information",
            desc: "Provide personal details and how we can reach you",
            icon: User,
            href: "/account/personal-info"
        },
        {
            title: "Login & security",
            desc: "Update your password and secure your account",
            icon: Shield,
            href: "/account/login-security"
        },
        {
            title: "Privacy & sharing",
            desc: "Manage your personal data, connected services, and data sharing settings",
            icon: Eye,
            href: "/account/privacy"
        },
        {
            title: "Notifications",
            desc: "Choose notification preferences and how you are contacted",
            icon: Bell,
            href: "/account/notifications"
        },
        {
            title: "Taxes",
            desc: "Manage tax documents and GST information",
            icon: FileText,
            href: "/account/taxes"
        },
        {
            title: "Payments",
            desc: "Review payments, payouts, coupons, and gift cards",
            icon: CreditCard,
            href: "/account/payments"
        },
        {
            title: "Languages & currency",
            desc: "Set your default language, currency, and timezone",
            icon: Globe,
            href: "/account/preferences"
        },
        {
            title: "Professional hosting tools",
            desc: "Get professional tools if you manage multiple properties",
            icon: Briefcase,
            href: "/hosting"
        }
    ];

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">Account Overview</h2>
            <div className="grid md:grid-cols-2 gap-4"> {/* Adjusted to 2 columns for better fit with new layout */}
                {cards.map((c, i) => (
                    <Card
                        key={i}
                        className="cursor-pointer hover:shadow-lg transition-shadow border-slate-200"
                        onClick={() => router.push(c.href)}
                    >
                        <CardHeader className="pb-3 pt-6">
                            <c.icon className="w-8 h-8 text-slate-900 mb-3" />
                            <CardTitle className="text-lg font-bold text-slate-900">{c.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-slate-500 text-sm leading-relaxed">
                                {c.desc}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
