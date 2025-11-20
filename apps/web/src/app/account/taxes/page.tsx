"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";

export default function TaxesPage() {
    return (
        <div className="max-w-3xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Taxes</h1>
                <p className="text-slate-500 mt-1">Manage your tax documents and GST information.</p>
            </div>

            <div className="p-8 border border-slate-200 rounded-2xl bg-white text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Add your GSTIN</h3>
                <p className="text-slate-500 max-w-md mx-auto text-sm">
                    If you are a business or professional host, adding your GST number helps us generate correct invoices.
                </p>

                <div className="max-w-xs mx-auto pt-4">
                    <Input placeholder="e.g. 22AAAAA0000A1Z5" className="text-center uppercase font-mono mb-3" />
                    <Button className="w-full bg-slate-900 text-white" onClick={() => toast.success("GST Details Saved")}>
                        Add Tax Details
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-slate-900">Tax Documents</h3>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                    <span className="text-sm text-slate-500">No tax documents available for 2024.</span>
                </div>
            </div>
        </div>
    );
}
