"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { updateUserProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function PersonalInfoPage() {
    const router = useRouter();
    const { user, updateUser, _hasHydrated } = useAuthStore();

    // Field Editing State
    const [editingField, setEditingField] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!_hasHydrated || !user) return null;

    const handleEditClick = (field: string, currentValue: string) => {
        setEditingField(field);
        setTempValue(currentValue);
    };

    const handleCancel = () => {
        setEditingField(null);
        setTempValue("");
    };

    const handleSave = async () => {
        if (!editingField) return;
        setIsLoading(true);

        try {
            const payload: any = {
                name: user.name,
                email: user.email || "",
                password: "",
            };

            // Map field to API payload
            if (editingField === "Legal Name") payload.name = tempValue;
            if (editingField === "Email Address") payload.email = tempValue;

            await updateUserProfile(payload);

            // Update Local Store
            updateUser({
                name: payload.name,
                email: payload.email
            });

            toast.success(`${editingField} updated`);
            setEditingField(null);
        } catch (error) {
            toast.error("Failed to update.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer w-fit" onClick={() => router.push("/account")}>
                <span className="text-slate-400">Account</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="text-slate-900">Personal info</span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 mb-10">Personal info</h1>

            <div className="space-y-6">

                {/* --- Row Component --- */}
                {[
                    { label: "Legal Name", value: user.name, desc: "This is the name on your travel document, which could be a license or a passport." },
                    { label: "Email Address", value: user.email || "Not provided", desc: "Use an address you’ll always have access to." },
                    { label: "Phone Number", value: user.phone, desc: "Contact support to verify a new number.", locked: true },
                    { label: "Government ID", value: "Not provided", desc: "Required for booking specific high-security spots.", locked: true, actionLabel: "Add" },
                ].map((item) => (
                    <div key={item.label} className="border-b border-slate-200 pb-6 last:border-0">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 pr-12">
                                <h3 className="text-base font-medium text-slate-900">{item.label}</h3>

                                {editingField === item.label ? (
                                    <div className="mt-3 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                        <Input
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            className="max-w-md h-12 text-base bg-white border-slate-300 focus:border-black focus:ring-black"
                                            autoFocus
                                        />
                                        <div className="flex gap-3">
                                            <Button onClick={handleSave} disabled={isLoading} className="bg-slate-900 text-white hover:bg-black rounded-lg px-6 font-semibold">
                                                Save
                                            </Button>
                                            <Button onClick={handleCancel} variant="ghost" className="hover:bg-slate-100 rounded-lg font-semibold text-slate-700">
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-1">
                                        <p className="text-slate-500">{item.value}</p>
                                    </div>
                                )}
                            </div>

                            {!editingField && (
                                <button
                                    onClick={() => !item.locked && handleEditClick(item.label, item.value)}
                                    disabled={item.locked}
                                    className={cn(
                                        "text-sm font-semibold underline hover:text-slate-600 transition-colors whitespace-nowrap",
                                        item.locked ? "text-slate-300 cursor-not-allowed no-underline" : "text-slate-900"
                                    )}
                                >
                                    {item.locked ? (item.actionLabel || "Locked") : "Edit"}
                                </button>
                            )}
                        </div>
                    </div>
                ))}

            </div>
        </main>
    );
}
