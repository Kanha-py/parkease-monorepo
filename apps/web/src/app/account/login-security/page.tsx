"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { updateUserProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Smartphone, Monitor, ChevronRight, Facebook, Chrome } from "lucide-react";

export default function LoginSecurityPage() {
    const { user, setAuth } = useAuthStore();

    // State
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handlePasswordUpdate = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            if (!user) return;
            const updatedUser = await updateUserProfile({
                name: user.name,
                email: user.email || "",
                password: newPassword,
            });

            const token = useAuthStore.getState().token;
            if (token) setAuth(token, updatedUser);

            toast.success("Password updated");
            setIsEditingPassword(false);
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            toast.error("Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-10">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="hover:text-slate-900 cursor-pointer">Account</span>
                <ChevronRight className="w-4 h-4" />
                <span className="font-semibold text-slate-900">Login & security</span>
            </div>

            <h1 className="text-3xl font-bold text-slate-900">Login & security</h1>

            {/* --- SECTION 1: LOGIN --- */}
            <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Login</h3>
                <div className="border-b border-slate-200 pb-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="font-medium text-slate-900">Password</p>
                            <p className="text-sm text-slate-500">Last updated recently</p>
                        </div>
                        <button
                            onClick={() => setIsEditingPassword(!isEditingPassword)}
                            className="text-slate-900 font-semibold underline hover:text-slate-600 text-sm"
                        >
                            {isEditingPassword ? "Cancel" : "Update"}
                        </button>
                    </div>

                    {/* Expandable Form */}
                    {isEditingPassword && (
                        <div className="mt-6 max-w-md space-y-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-2">
                                <Label>New password</Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm password</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <Button onClick={handlePasswordUpdate} disabled={isLoading} className="bg-slate-900 text-white h-12 px-6 mt-2">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* --- SECTION 2: SOCIAL ACCOUNTS --- */}
            <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 mt-8">Social accounts</h3>

                {/* Facebook */}
                <div className="border-b border-slate-200 py-6 flex justify-between items-center">
                    <div className="space-y-1">
                        <p className="font-medium text-slate-900">Facebook</p>
                        <p className="text-sm text-slate-500">Not connected</p>
                    </div>
                    <button className="text-slate-900 font-semibold underline hover:text-slate-600 text-sm" onClick={() => toast.info("Social login coming in Phase 2")}>
                        Connect
                    </button>
                </div>

                {/* Google */}
                <div className="border-b border-slate-200 py-6 flex justify-between items-center">
                    <div className="space-y-1">
                        <p className="font-medium text-slate-900">Google</p>
                        <p className="text-sm text-green-600">Connected</p>
                    </div>
                    <button className="text-slate-900 font-semibold underline hover:text-slate-600 text-sm">
                        Disconnect
                    </button>
                </div>
            </section>

            {/* --- SECTION 3: DEVICE HISTORY --- */}
            <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 mt-8">Device history</h3>

                {/* Current Session */}
                <div className="py-6 border-b border-slate-200">
                    <div className="flex items-start gap-4">
                        <Monitor className="w-8 h-8 text-slate-400" />
                        <div className="flex-1">
                            <p className="font-medium text-slate-900">Windows 10 · Chrome</p>
                            <p className="text-sm text-slate-500">Mumbai, India · <span className="text-green-600 font-medium">Current session</span></p>
                        </div>
                        <button className="text-slate-900 font-semibold underline hover:text-slate-600 text-sm" onClick={() => toast.success("Logged out")}>
                            Log out device
                        </button>
                    </div>
                </div>

                {/* Past Session */}
                <div className="py-6 border-b border-slate-200">
                    <div className="flex items-start gap-4">
                        <Smartphone className="w-8 h-8 text-slate-400" />
                        <div className="flex-1">
                            <p className="font-medium text-slate-900">iPhone 13 · ParkEase App</p>
                            <p className="text-sm text-slate-500">Pune, India · October 28 at 4:30 PM</p>
                        </div>
                        <button className="text-slate-900 font-semibold underline hover:text-slate-600 text-sm">
                            Log out device
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
