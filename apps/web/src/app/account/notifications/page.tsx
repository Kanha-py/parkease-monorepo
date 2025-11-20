"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

export default function NotificationsPage() {
    const [settings, setSettings] = useState({
        email: true,
        sms: true,
        marketing: false,
    });

    const toggle = (key: keyof typeof settings) => {
        setSettings(p => ({ ...p, [key]: !p[key] }));
        toast.success("Notification preference updated");
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-10">
                <span className="hover:text-slate-900 cursor-pointer">Account</span>
                <ChevronRight className="w-4 h-4" />
                <span className="font-semibold text-slate-900">Notifications</span>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-10">Notifications</h1>

            <div className="space-y-10">

                <section>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Account Activity</h3>
                    <div className="border-b border-slate-200 pb-6">
                        <div className="flex items-center justify-between py-4">
                            <div>
                                <p className="font-medium text-slate-900">Email notifications</p>
                                <p className="text-sm text-slate-500">Booking confirmations and receipts.</p>
                            </div>
                            <Switch checked={settings.email} onCheckedChange={() => toggle("email")} />
                        </div>
                        <div className="flex items-center justify-between py-4">
                            <div>
                                <p className="font-medium text-slate-900">SMS notifications</p>
                                <p className="text-sm text-slate-500">Real-time updates about your trip.</p>
                            </div>
                            <Switch checked={settings.sms} onCheckedChange={() => toggle("sms")} />
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Marketing</h3>
                    <div className="border-b border-slate-200 pb-6">
                        <div className="flex items-center justify-between py-4">
                            <div>
                                <p className="font-medium text-slate-900">Promotional emails</p>
                                <p className="text-sm text-slate-500">Tips, offers, and ParkEase news.</p>
                            </div>
                            <Switch checked={settings.marketing} onCheckedChange={() => toggle("marketing")} />
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
