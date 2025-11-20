"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { updateUserProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function LoginSecurityPage() {
    const { user, setAuth, token } = useAuthStore();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    if (!user) return null;

    const handleUpdate = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const updatedUser = await updateUserProfile({ password: newPassword });

            if (token) setAuth(token, updatedUser);

            toast.success("Password updated successfully");
            setIsEditing(false);
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error("Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Login & Security</h1>
                <p className="text-slate-500 mt-1">Manage your password and account access.</p>
            </div>

            <Separator />

            {/* Login Section */}
            <section className="mb-10">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Login</h3>
                <div className="border-b border-slate-100 pb-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="font-medium text-slate-900">Password</p>
                            <p className="text-sm text-slate-500">Last updated recently</p>
                        </div>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {isEditing ? "Cancel" : "Update"}
                        </button>
                    </div>

                    {isEditing && (
                        <div className="mt-6 max-w-md space-y-4 animate-in slide-in-from-top-2 bg-slate-50 p-6 rounded-xl">
                            <div className="space-y-2">
                                <Label>New password</Label>
                                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-11 bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm password</Label>
                                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11 bg-white" />
                            </div>
                            <div className="pt-2">
                                <Button onClick={handleUpdate} disabled={loading} className="bg-slate-900 hover:bg-black text-white px-8 h-11 w-full sm:w-auto">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Social Accounts (Placeholder) */}
            <section>
                 <h3 className="text-lg font-semibold text-slate-900 mb-4">Social accounts</h3>
                 <div className="border-b border-slate-100 py-4 flex justify-between items-center">
                    <div className="space-y-1">
                        <p className="font-medium text-slate-900">Google</p>
                        <p className="text-sm text-slate-500">Not connected</p>
                    </div>
                    <button className="text-sm font-semibold text-slate-400 cursor-not-allowed">
                        Connect
                    </button>
                 </div>
            </section>
        </div>
    );
}
