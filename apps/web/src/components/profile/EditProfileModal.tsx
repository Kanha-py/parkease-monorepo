"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Camera, X, Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
    const { user, updateUser } = useAuthStore();

    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [bio, setBio] = useState(user?.bio || "");
    const [work, setWork] = useState(user?.work || "");
    const [location, setLocation] = useState(user?.location || "");
    const [languages, setLanguages] = useState(user?.languages || "");
    const [interests, setInterests] = useState<string[]>(user?.interests || []);
    const [photoPreview, setPhotoPreview] = useState(user?.profile_picture_url || "");

    const availableInterests = [
        "Foodie", "Hiking", "Tech", "History", "Art", "Music",
        "Road Trips", "Photography", "Reading", "Architecture", "Design"
    ];

    const toggleInterest = (tag: string) => {
        if (interests.includes(tag)) {
            setInterests(interests.filter(i => i !== tag));
        } else {
            setInterests([...interests, tag]);
        }
    };

    // --- 1. Handle File Selection ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check size (e.g., 2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Image size must be less than 2MB");
                return;
            }

            // Convert to Data URL for preview
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPhotoPreview(result);
                toast.success("Photo selected");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPhotoPreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = () => {
        updateUser({
            bio,
            work,
            location,
            languages,
            interests,
            profile_picture_url: photoPreview // Save the Data URL to store
        });
        toast.success("Profile saved");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[680px] p-0 gap-0 rounded-xl overflow-hidden bg-white max-h-[90vh] flex flex-col">

                {/* Hidden Input for File Upload */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                />

                {/* 1. Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white z-10">
                    <DialogTitle className="text-lg font-bold text-slate-900">Edit Profile</DialogTitle>
                </div>

                {/* 2. Scrollable Content */}
                <div className="overflow-y-auto flex-1 p-8 space-y-10">

                    {/* Photo Section */}
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold text-slate-900">Profile photo</h3>
                            <p className="text-sm text-slate-500">Visible to everyone</p>
                        </div>

                        <div
                            className="relative group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 group-hover:border-slate-900 transition-colors relative">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                        <Camera className="w-8 h-8 opacity-50 mb-1" />
                                        <span className="text-[10px] font-bold uppercase tracking-wide">Upload</span>
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-white drop-shadow-md" />
                                </div>
                            </div>

                            {photoPreview && (
                                <button
                                    onClick={handleRemovePhoto}
                                    className="absolute -top-1 -right-1 bg-white text-red-500 p-1.5 rounded-full shadow-md border border-slate-100 hover:bg-red-50 transition-colors z-10"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}

                            <button className="text-sm font-semibold underline text-slate-900 mt-2 w-full text-center">
                                {photoPreview ? "Change" : "Add"}
                            </button>
                        </div>
                    </div>

                    {/* About You */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <h3 className="text-xl font-semibold text-slate-900">About you</h3>
                        </div>
                        <div className="relative">
                            <Textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="min-h-[160px] text-base p-4 rounded-xl border-slate-400 focus:border-black focus:ring-1 focus:ring-black resize-none"
                                placeholder="I love road trips..."
                            />
                            <span className="absolute bottom-4 right-4 text-xs text-slate-400">{bio.length}/450</span>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-slate-900">Details</h3>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-base font-medium text-slate-700">Where I live</Label>
                                <Input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="h-12 text-base border-slate-300 focus:border-black focus:ring-black rounded-lg"
                                    placeholder="e.g. Mumbai, India"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base font-medium text-slate-700">My work</Label>
                                <Input
                                    value={work}
                                    onChange={(e) => setWork(e.target.value)}
                                    className="h-12 text-base border-slate-300 focus:border-black focus:ring-black rounded-lg"
                                    placeholder="e.g. Software Engineer"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base font-medium text-slate-700">Languages I speak</Label>
                                <Input
                                    value={languages}
                                    onChange={(e) => setLanguages(e.target.value)}
                                    className="h-12 text-base border-slate-300 focus:border-black focus:ring-black rounded-lg"
                                    placeholder="e.g. English, Hindi"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Interests (Tags) */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-slate-900">Interests</h3>
                        <div className="flex flex-wrap gap-3">
                            {availableInterests.map(tag => {
                                const isSelected = interests.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => toggleInterest(tag)}
                                        className={cn(
                                            "px-4 py-2.5 rounded-full text-sm font-medium transition-all border flex items-center gap-2",
                                            isSelected
                                                ? "bg-slate-50 border-black text-black ring-1 ring-black"
                                                : "bg-white text-slate-600 border-slate-300 hover:border-slate-800"
                                        )}
                                    >
                                        {tag}
                                        {isSelected ? null : <Plus className="w-3 h-3" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. Footer (Fixed) */}
                <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                    <Button variant="ghost" className="font-semibold underline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-slate-900 text-white hover:bg-black rounded-lg px-8 h-11 text-base font-semibold">
                        Done
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
