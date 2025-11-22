"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/lib/api";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";

interface WriteReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    onSuccess: () => void;
}

export function WriteReviewModal({ isOpen, onClose, bookingId, onSuccess }: WriteReviewModalProps) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await createReview({ booking_id: bookingId, rating, comment });
            toast.success("Review submitted!");
            onSuccess();
            onClose();
        } catch (e) {
            toast.error("Failed to submit review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Rate your experience</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} onClick={() => setRating(star)}>
                                <Star
                                    className={`w-8 h-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="font-medium text-slate-900">{rating === 5 ? "Excellent!" : rating > 3 ? "Good" : "Could be better"}</p>

                    <Textarea
                        placeholder="Share details of your parking experience..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px]"
                    />

                    <Button onClick={handleSubmit} disabled={loading} className="w-full bg-slate-900">
                        {loading ? <Loader2 className="animate-spin" /> : "Submit Review"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
