"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

export default function PreferencesPage() {
    const [currency, setCurrency] = useState("INR");
    const [language, setLanguage] = useState("en");
    const [editing, setEditing] = useState<string | null>(null);

    const handleSave = () => {
        setEditing(null);
        toast.success("Preference updated");
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-10">
                <span className="hover:text-slate-900 cursor-pointer">Account</span>
                <ChevronRight className="w-4 h-4" />
                <span className="font-semibold text-slate-900">Global preferences</span>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-10">Global preferences</h1>

            <div className="space-y-8">

                {/* Preferred Currency */}
                <div className="border-b border-slate-200 pb-8">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h3 className="font-medium text-slate-900">Preferred currency</h3>
                            <p className="text-sm text-slate-500">This is how you will see prices.</p>
                        </div>
                        <button onClick={() => setEditing(editing === "currency" ? null : "currency")} className="text-slate-900 font-semibold underline text-sm">
                            {editing === "currency" ? "Cancel" : "Edit"}
                        </button>
                    </div>

                    {editing === "currency" ? (
                        <div className="mt-4 max-w-xs space-y-4">
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleSave} className="bg-slate-900 text-white">Save</Button>
                        </div>
                    ) : (
                        <p className="mt-2 text-slate-900">{currency === "INR" ? "Indian Rupee (₹)" : "US Dollar ($)"}</p>
                    )}
                </div>

                {/* Preferred Language */}
                <div className="border-b border-slate-200 pb-8">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h3 className="font-medium text-slate-900">Preferred language</h3>
                            <p className="text-sm text-slate-500">This is how you will see the interface.</p>
                        </div>
                        <button onClick={() => setEditing(editing === "language" ? null : "language")} className="text-slate-900 font-semibold underline text-sm">
                            {editing === "language" ? "Cancel" : "Edit"}
                        </button>
                    </div>

                    {editing === "language" ? (
                        <div className="mt-4 max-w-xs space-y-4">
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleSave} className="bg-slate-900 text-white">Save</Button>
                        </div>
                    ) : (
                        <p className="mt-2 text-slate-900">{language === "en" ? "English" : "Hindi"}</p>
                    )}
                </div>

            </div>
        </div>
    );
}
