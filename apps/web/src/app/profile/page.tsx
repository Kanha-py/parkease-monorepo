"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import {
    ShieldCheck, Star, Check, Briefcase, MapPin, Languages, GraduationCap, Plus
} from "lucide-react";

export default function PublicProfilePage() {
    const router = useRouter();
    const { user, _hasHydrated } = useAuthStore();
    const [isEditOpen, setIsEditOpen] = useState(false);

    if (!_hasHydrated || !user) return null;

    // Mock Data
    const isHost = user.role === "SELLER_C2B";
    const reviewCount = 0;
    const rating = "New";

    // Helper to check if we have ANY details
    const hasDetails = user.work || user.location || user.languages || user.school;

    return (
        <main className="container mx-auto py-12 px-6 max-w-6xl">
            <div className="grid md:grid-cols-3 gap-12 md:gap-24">

                {/* --- LEFT COLUMN: ID CARD --- */}
                <div className="md:col-span-1">
                    <div className="border border-slate-200 rounded-3xl shadow-[0_6px_16px_rgba(0,0,0,0.08)] p-6 md:p-8 sticky top-24 bg-white">

                        <div className="flex flex-col items-center text-center">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-sm flex items-center justify-center">
                                    {user.profile_picture_url ? (
                                        <img src={user.profile_picture_url} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold text-slate-300">{user.name[0]}</span>
                                    )}
                                </div>
                                <div className="absolute bottom-2 right-2 bg-slate-900 text-white rounded-full p-1.5 border-2 border-white shadow-sm">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                            </div>
                            <h2 className="mt-4 text-2xl font-bold text-slate-900">{user.name.split(" ")[0]}</h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">{isHost ? "Host" : "Driver"}</p>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-lg font-bold text-slate-900">{reviewCount}</p>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Reviews</p>
                            </div>
                            <div className="text-center border-l border-slate-100">
                                <div className="flex items-center justify-center gap-1">
                                    <p className="text-lg font-bold text-slate-900">{rating}</p>
                                    {rating !== "New" && <Star className="w-3 h-3 fill-slate-900 text-slate-900" />}
                                </div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Rating</p>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <h3 className="font-bold text-slate-900 text-lg">Confirmed info</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-slate-600">
                                    <Check className="w-5 h-5 text-slate-900" /> Identity
                                </li>
                                <li className="flex items-center gap-3 text-slate-600">
                                    <Check className="w-5 h-5 text-slate-900" /> Phone number
                                </li>
                                {user.email && (
                                    <li className="flex items-center gap-3 text-slate-600">
                                        <Check className="w-5 h-5 text-slate-900" /> Email address
                                    </li>
                                )}
                            </ul>
                        </div>

                         {/* Edit Button (Visible only to owner) */}
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <Button
                                variant="outline"
                                className="w-full border-slate-900 text-slate-900 hover:bg-slate-50"
                                onClick={() => setIsEditOpen(true)}
                            >
                                Edit Profile
                            </Button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: CONTENT --- */}
                <div className="md:col-span-2 py-4 space-y-10">

                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Hi, I'm {user.name.split(" ")[0]}</h1>
                        <p className="text-slate-500">Joined in 2025</p>
                    </div>

                    {/* About Me (With Empty State) */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-900">About</h3>
                        {user.bio ? (
                            <p className="text-slate-600 leading-relaxed text-lg">{user.bio}</p>
                        ) : (
                            <button
                                onClick={() => setIsEditOpen(true)}
                                className="text-slate-500 hover:text-slate-800 underline decoration-dashed underline-offset-4"
                            >
                                Write a bio to help hosts get to know you...
                            </button>
                        )}
                    </section>

                    {/* Details Grid (With Empty State) */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {user.work ? (
                            <div className="flex items-center gap-3 text-slate-700"><Briefcase className="w-5 h-5" /> My work: {user.work}</div>
                        ) : (
                            <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors text-left">
                                <Briefcase className="w-5 h-5" /> Add your work
                            </button>
                        )}

                        {user.location ? (
                            <div className="flex items-center gap-3 text-slate-700"><MapPin className="w-5 h-5" /> Lives in {user.location}</div>
                        ) : (
                            <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors text-left">
                                <MapPin className="w-5 h-5" /> Add where you live
                            </button>
                        )}

                        {user.languages ? (
                            <div className="flex items-center gap-3 text-slate-700"><Languages className="w-5 h-5" /> Speaks {user.languages}</div>
                        ) : (
                            <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors text-left">
                                <Languages className="w-5 h-5" /> Add languages you speak
                            </button>
                        )}

                        {user.school ? (
                            <div className="flex items-center gap-3 text-slate-700"><GraduationCap className="w-5 h-5" /> Studied at {user.school}</div>
                        ) : null}
                    </section>

                    <div className="h-[1px] bg-slate-200" />

                    {/* Interests (With Empty State) */}
                    <section>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Interests</h3>
                        {user.interests && user.interests.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {user.interests.map((tag) => (
                                    <span key={tag} className="px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-700 font-medium text-sm shadow-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditOpen(true)}
                                className="px-4 py-2 rounded-full border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 flex items-center gap-2 w-fit"
                            >
                                <Plus className="w-4 h-4" /> Add interests
                            </button>
                        )}
                    </section>

                    {/* Reviews */}
                    <section>
                         <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 fill-slate-900" />
                            {reviewCount} reviews
                         </h3>
                         <div className="p-8 border border-slate-200 rounded-2xl bg-slate-50/50 text-center">
                             <p className="text-slate-900 font-medium mb-1">No reviews yet</p>
                             <p className="text-slate-500 text-sm">Reviews will appear here once you complete a trip.</p>
                         </div>
                    </section>
                </div>
            </div>

            {/* Modal */}
            <EditProfileModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
            />
        </main>
    );
}
