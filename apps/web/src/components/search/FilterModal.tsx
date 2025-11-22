"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Zap, Umbrella, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FilterState {
    minPrice: number;
    maxPrice: number;
    instantBook: boolean;
    covered: boolean;
    cctv: boolean;
}

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
}

export function FilterModal({ isOpen, onClose, onApply }: FilterModalProps) {
    const [priceRange, setPriceRange] = useState([0, 500]);
    const [amenities, setAmenities] = useState({
        instantBook: false,
        covered: false,
        cctv: false
    });

    const handleApply = () => {
        onApply({
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
            ...amenities
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Filter Spots</DialogTitle>
                </DialogHeader>

                <div className="py-6 space-y-8">
                    {/* Price Range */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-base font-semibold">Price Range (Hourly)</Label>
                            <Badge variant="secondary" className="text-sm">₹{priceRange[0]} - ₹{priceRange[1]}+</Badge>
                        </div>
                        <Slider
                            min={0} max={500} step={10}
                            value={priceRange}
                            onValueChange={setPriceRange}
                            className="py-4"
                        />
                    </div>

                    {/* Amenities */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Features</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <FilterOption
                                icon={<Zap className="w-4 h-4 text-yellow-500" />}
                                label="Instant Book"
                                checked={amenities.instantBook}
                                // FIX: Explicitly type the checked value
                                onChange={(c: boolean | string) => setAmenities(prev => ({...prev, instantBook: !!c}))}
                            />
                            <FilterOption
                                icon={<Umbrella className="w-4 h-4 text-blue-500" />}
                                label="Covered"
                                checked={amenities.covered}
                                onChange={(c: boolean | string) => setAmenities(prev => ({...prev, covered: !!c}))}
                            />
                            <FilterOption
                                icon={<Video className="w-4 h-4 text-red-500" />}
                                label="CCTV"
                                checked={amenities.cctv}
                                onChange={(c: boolean | string) => setAmenities(prev => ({...prev, cctv: !!c}))}
                            />
                            <FilterOption
                                icon={<Shield className="w-4 h-4 text-green-500" />}
                                label="Guarded"
                                checked={false}
                                disabled={true}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleApply} className="bg-slate-900 text-white hover:bg-black">Show Results</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Helper Component
interface FilterOptionProps {
    icon: React.ReactNode;
    label: string;
    checked: boolean;
    onChange?: (checked: boolean | string) => void;
    disabled?: boolean;
}

function FilterOption({ icon, label, checked, onChange, disabled }: FilterOptionProps) {
    return (
        <div
            className={`flex items-center space-x-3 p-3 border rounded-xl transition-all
            ${checked ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && onChange && onChange(!checked)}
        >
            <Checkbox
                id={label}
                checked={checked}
                onCheckedChange={onChange}
                disabled={disabled}
                className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
            />
            <label htmlFor={label} className="text-sm font-medium leading-none flex items-center gap-2 cursor-pointer w-full select-none">
                {icon}
                {label}
            </label>
        </div>
    );
}
