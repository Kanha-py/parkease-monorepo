"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getPayoutAccount, PayoutAccount } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Plus, Wallet, IndianRupee, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PaymentsPage() {
    const { user } = useAuthStore();
    const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getPayoutAccount()
                .then(data => {
                    console.log("Payout Account Data:", data); // Debug log
                    setPayoutAccount(data);
                })
                .catch(() => setPayoutAccount(null))
                .finally(() => setLoading(false));
        }
    }, [user]);

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Payments & Payouts</h1>
                <p className="text-slate-500 mt-1">Manage how you pay and how you get paid.</p>
            </div>

            <Tabs defaultValue="payments" className="space-y-8">
                <TabsList className="bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="payments" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Payments</TabsTrigger>
                    <TabsTrigger value="payouts" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Payouts</TabsTrigger>
                </TabsList>

                {/* --- TAB 1: PAYMENTS (Driver Side) --- */}
                <TabsContent value="payments" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Payment Methods</CardTitle>
                            <CardDescription>Cards and UPI IDs saved for future bookings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Saved Card Mock */}
                            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-xs">VISA</div>
                                    <div>
                                        <p className="font-medium text-slate-900">Visa ending in 4242</p>
                                        <p className="text-sm text-slate-500">Expires 12/28</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                            </div>

                            <Button variant="outline" className="w-full border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 h-12">
                                <Plus className="w-4 h-4 mr-2" /> Add Payment Method
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">ParkEase Credits</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Wallet className="w-6 h-6 text-slate-400" />
                                <span className="font-medium text-slate-900">₹0.00</span>
                            </div>
                            <Button variant="link" className="text-slate-900 underline">Add funds</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 2: PAYOUTS (Seller Side) --- */}
                <TabsContent value="payouts" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">How you get paid</CardTitle>
                            <CardDescription>Accounts where we send your earnings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                            ) : payoutAccount ? (
                                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-600">
                                            <IndianRupee className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-green-800">Connected UPI Account</p>
                                            {/* FIXED: Added optional chaining (?.) to prevent crash */}
                                            <p className="text-sm text-green-700 font-mono">
                                                {payoutAccount.details?.upi_id || "UPI Linked"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-white rounded-full text-xs font-bold text-green-700 shadow-sm">Active</div>
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500 mb-4">You haven't set up a payout method yet.</p>
                                    <Button onClick={() => toast.info("Go to 'List a Spot' to setup payments.")} className="bg-slate-900 text-white">
                                        Setup Payouts
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
