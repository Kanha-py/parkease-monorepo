"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { updateUserProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function PersonalInfoPage() {
    const { user, setAuth, token } = useAuthStore();
    const [editingField, setEditingField] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!user) return null;

    const handleEditClick = (field: string, currentValue: string) => {
        setEditingField(field);
        setTempValue(currentValue);
    };

    const handleSave = async () => {
        if (!editingField) return;
        setIsLoading(true);

        try {
            const payload: any = {};
            if (editingField === "Legal Name") payload.name = tempValue;
            if (editingField === "Email Address") payload.email = tempValue;

            const updatedUser = await updateUserProfile(payload);
            if (token) setAuth(token, updatedUser);

            toast.success(`${editingField} updated`);
            setEditingField(null);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to update");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Personal Information</h1>
                <p className="text-slate-500 mt-1">Update your personal details here.</p>
            </div>

            <Separator />

            <div className="space-y-6">
                {/* Legal Name */}
                <InfoRow
                    label="Legal Name"
                    value={user.name}
                    desc="This is the name on your travel document."
                    isEditing={editingField === "Legal Name"}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    onEdit={() => handleEditClick("Legal Name", user.name)}
                    onCancel={() => setEditingField(null)}
                    onSave={handleSave}
                    loading={isLoading}
                />

                {/* Email */}
                <InfoRow
                    label="Email Address"
                    value={user.email || "Not provided"}
                    desc="Use an address you’ll always have access to."
                    isEditing={editingField === "Email Address"}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    onEdit={() => handleEditClick("Email Address", user.email || "")}
                    onCancel={() => setEditingField(null)}
                    onSave={handleSave}
                    loading={isLoading}
                />

                {/* Phone (Read Only) */}
                <div className="flex justify-between items-start py-4">
                    <div>
                        <h3 className="font-medium text-slate-900">Phone Number</h3>
                        <div className="mt-1 text-slate-600 font-mono">{user.phone}</div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded w-fit">
                            <AlertCircle className="w-3 h-3" /> Contact support to update
                        </div>
                    </div>
                    <span className="text-sm text-slate-300 font-medium select-none px-3 py-1">Locked</span>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, desc, isEditing, tempValue, setTempValue, onEdit, onCancel, onSave, loading }: any) {
    return (
        <div className="border-b border-slate-100 pb-6 last:border-0">
            <div className="flex justify-between items-start">
                <div className="flex-1 pr-12">
                    <h3 className="font-medium text-slate-900">{label}</h3>

                    {isEditing ? (
                        <div className="mt-4 animate-in fade-in zoom-in-95 duration-200 bg-slate-50 p-4 rounded-xl">
                            <p className="text-sm text-slate-500 mb-4">{desc}</p>
                            <Input
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="max-w-md h-11 text-base bg-white mb-4"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <Button onClick={onSave} disabled={loading} className="bg-slate-900 hover:bg-black text-white font-semibold h-10 px-6">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                                </Button>
                                <Button onClick={onCancel} variant="ghost" className="h-10 font-medium text-slate-600 hover:text-slate-900 hover:bg-white">Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-1 text-slate-600">{value}</div>
                    )}
                </div>

                {!isEditing && (
                    <button onClick={onEdit} className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors px-2 py-1">
                        Edit
                    </button>
                )}
            </div>
        </div>
    );
}
