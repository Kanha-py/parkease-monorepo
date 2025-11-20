"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronRight, Cookie } from "lucide-react";

export default function PrivacyPage() {
    const [settings, setSettings] = useState({
        search_engines: false,
        read_receipts: true,
        data_sharing: false
    });

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            toast.success("Privacy setting updated");
            return newState;
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-10">
             {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="hover:text-slate-900 cursor-pointer">Account</span>
                <ChevronRight className="w-4 h-4" />
                <span className="font-semibold text-slate-900">Privacy & sharing</span>
            </div>

            <h1 className="text-3xl font-bold text-slate-900">Privacy & sharing</h1>
            <p className="text-slate-500 mt-1">Manage your data and how you share with others.</p>
            <div className="space-y-8">
                <section>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">Visibility</h3>

                    <div className="flex items-center justify-between py-2">
                        <div className="space-y-1">
                            <Label className="text-base font-medium text-slate-700">Include in search engines</Label>
                            <p className="text-sm text-slate-500 max-w-md">
                                Allow search engines (like Google) to show your profile.
                            </p>
                        </div>
                        <Switch checked={settings.search_engines} onCheckedChange={() => toggle("search_engines")} />
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">Data Sharing</h3>

                    <div className="flex items-center justify-between py-4">
                        <div className="space-y-1">
                            <Label className="text-base font-medium text-slate-700">Read Receipts</Label>
                            <p className="text-sm text-slate-500">
                                Let hosts know when you've read their messages.
                            </p>
                        </div>
                        <Switch checked={settings.read_receipts} onCheckedChange={() => toggle("read_receipts")} />
                    </div>

                    <div className="flex items-center justify-between py-4">
                        <div className="space-y-1">
                            <Label className="text-base font-medium text-slate-700">Personalization</Label>
                            <p className="text-sm text-slate-500 max-w-md">
                                Allow ParkEase to use your data to suggest nearby spots.
                            </p>
                        </div>
                        <Switch checked={settings.data_sharing} onCheckedChange={() => toggle("data_sharing")} />
                    </div>
                </section>

                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex gap-4 mt-4">
                    <Cookie className="w-6 h-6 text-slate-500 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Manage Cookie Preferences</h4>
                        <p className="text-xs text-slate-500 mt-1">Change your cookie settings at any time.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
