"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format, differenceInMinutes } from "date-fns";
import { Loader2, MapPin, Clock, Car, CreditCard, IndianRupee } from "lucide-react";
import { SearchResult } from "@/lib/api";

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  lot: SearchResult | null;
  startTime: string;
  endTime: string;
  vehicleType: string;
}

export function BookingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  lot,
  startTime,
  endTime,
  vehicleType,
}: BookingConfirmationModalProps) {
  if (!lot || !startTime || !endTime) return null;

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Calculate Duration
  const totalMinutes = differenceInMinutes(end, start);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const durationString = `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m` : ""}`;

  // Calculate Fees (Mock logic to match backend)
  // In a real app, you might fetch a quote from the backend first.
  // Here we assume the 'lot.price' passed is the total estimate from the search API.
  const totalAmount = lot.price;
  const platformFee = Math.round(totalAmount * 0.10); // Mock 10% (included or extra depending on logic)
  const basePrice = totalAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl gap-0">
        <div className="bg-slate-50 p-6 border-b border-slate-100">
            <DialogHeader>
            <DialogTitle className="text-xl font-bold">Review Booking</DialogTitle>
            </DialogHeader>

            <div className="mt-4 flex items-start gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                    <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h4 className="font-semibold text-slate-900">{lot.name}</h4>
                    <p className="text-sm text-slate-500">{lot.address}</p>
                </div>
            </div>
        </div>

        <div className="p-6 space-y-6">
            {/* Time Details */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Start</span>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {format(start, "MMM dd, HH:mm")}
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">End</span>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {format(end, "HH:mm")}
                    </div>
                </div>
            </div>

            {/* Vehicle */}
            <div className="flex items-center gap-2 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-600">
                <Car className="w-4 h-4" />
                <span>Vehicle: <span className="font-semibold text-slate-900">{vehicleType}</span></span>
                <span className="mx-2 text-slate-300">|</span>
                <span>Duration: <span className="font-semibold text-slate-900">{durationString}</span></span>
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Parking Fee</span>
                    <span>₹{basePrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Service Fee</span>
                    <span className="text-green-600">Free</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-xl text-slate-900">₹{basePrice}</span>
                </div>
            </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100">
            <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200">
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    className="flex-[2] bg-slate-900 hover:bg-slate-800 font-bold"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Pay ₹{basePrice}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
