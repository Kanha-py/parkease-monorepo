"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import {
  MapPin, ShieldCheck, Star, Car, Briefcase, Languages, GraduationCap, Edit3, CheckCircle2
} from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (_hasHydrated && !user) {
      router.push("/");
    }
  }, [user, _hasHydrated, router]);

  if (!_hasHydrated || !user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const isSeller = user.role.includes("SELLER") || user.role.includes("OPERATOR");

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Header Removed - Provided by Layout */}

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-12">

          {/* --- Left Column: Identity --- */}
          <div className="space-y-8">
            <Card className="overflow-hidden border-slate-200 shadow-lg rounded-2xl">
                <div className="px-8 py-10 flex flex-col items-center text-center relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 md:hidden text-slate-400"
                        onClick={() => setShowEdit(true)}
                    >
                        <Edit3 className="w-5 h-5" />
                    </Button>

                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl mb-6">
                        <AvatarImage src={user.profile_picture_url} alt={user.name} className="object-cover" />
                        <AvatarFallback className="bg-slate-900 text-white text-3xl font-bold">{initials}</AvatarFallback>
                    </Avatar>

                    <h1 className="text-2xl font-bold text-slate-900 mb-1">{user.name}</h1>
                    <p className="text-slate-500 font-medium mb-4">
                        {isSeller ? "Super Host" : "Member"}
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {isSeller && (
                            <Badge className="bg-slate-900 hover:bg-slate-800 text-white gap-1 py-1 px-3">
                                <ShieldCheck className="w-3 h-3" /> Host
                            </Badge>
                        )}
                        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 gap-1 py-1 px-3">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                        </Badge>
                    </div>
                </div>

                <Separator />

                <div className="p-8 bg-slate-50/50 space-y-6">
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4 text-lg">Confirmed Information</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span>Identity</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span>Email address</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span>Phone number</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </Card>
          </div>

          {/* --- Right Column: Bio --- */}
          <div className="md:col-span-2 space-y-10">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Hi, I'm {user.name.split(" ")[0]}</h2>
                    <p className="text-slate-500 text-lg">Joined in {format(new Date(user.created_at || Date.now()), "yyyy")}</p>
                </div>
                <Button onClick={() => setShowEdit(true)} variant="outline" className="hidden md:flex gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl h-12 px-6">
                    <Edit3 className="w-4 h-4" /> Edit Profile
                </Button>
            </div>

            <div className="prose prose-slate max-w-none">
                <p className="text-lg text-slate-600 leading-relaxed">
                    {user.bio || "I haven't written a bio yet, but I love finding great parking spots!"}
                </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
                {user.work && (
                    <div className="flex items-center gap-4 text-slate-700 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <Briefcase className="w-6 h-6 text-slate-400" />
                        <span className="text-lg">{user.work}</span>
                    </div>
                )}
                {user.school && (
                    <div className="flex items-center gap-4 text-slate-700 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <GraduationCap className="w-6 h-6 text-slate-400" />
                        <span className="text-lg">{user.school}</span>
                    </div>
                )}
                {user.location && (
                    <div className="flex items-center gap-4 text-slate-700 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <MapPin className="w-6 h-6 text-slate-400" />
                        <span className="text-lg">Lives in {user.location}</span>
                    </div>
                )}
                {user.languages && (
                    <div className="flex items-center gap-4 text-slate-700 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <Languages className="w-6 h-6 text-slate-400" />
                        <span className="text-lg">Speaks {user.languages}</span>
                    </div>
                )}
            </div>

            <Separator />

            {user.interests && user.interests.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Interests</h3>
                    <div className="flex flex-wrap gap-3">
                        {user.interests.map((tag) => (
                            <div key={tag} className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-sm font-medium hover:border-slate-400 hover:bg-white transition-all cursor-default flex items-center gap-2">
                                {tag}
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>

        <EditProfileModal open={showEdit} onOpenChange={setShowEdit} user={user} />
      </main>
    </div>
  );
}
