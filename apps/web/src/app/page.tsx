"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/auth/LoginModal";
import { PlacesAutocomplete } from "@/components/search/PlacesAutocomplete";
import { useAuthStore } from "@/store/useAuthStore";
import { useLoadScript } from "@react-google-maps/api";
import {
  Search, MapPin, ShieldCheck, Zap, Star, Smartphone, Apple, Building2, ArrowRight, Users, Car, Clock
} from "lucide-react";

const LIBRARIES: ("places")[] = ["places"];

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
    id: "google-map-script"
  });

  const handleSearch = () => {
    const lat = coords?.lat || 19.0760;
    const lng = coords?.lng || 72.8777;
    const q = locationName || "Mumbai";
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      lat: lat.toString(),
      long: lng.toString(),
      start: now.toISOString(),
      end: twoHoursLater.toISOString(),
      q: q
    });

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">

      {/* HEADER REMOVED - Provided by RootLayout */}

      <main className="flex-grow">

        {/* --- Hero Section --- */}
        <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-40 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

              {/* Left Column */}
              <div className="w-full lg:w-1/2 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Live in your city
                </div>

                <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight text-slate-900">
                  Parking made <br />
                  <span className="text-blue-600">human.</span>
                </h1>

                <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
                  Stop circling the block. Book guaranteed, private spots in driveways and malls instantly.
                </p>

                <div className="bg-white p-2 rounded-2xl shadow-2xl shadow-blue-900/10 max-w-xl border border-slate-100 flex flex-col sm:flex-row gap-2 relative z-20">
                  <PlacesAutocomplete
                    isLoaded={isLoaded}
                    onSelect={(lat, lng, address) => {
                      setCoords({ lat, lng });
                      setLocationName(address);
                    }}
                  />
                  <Button size="lg" className="h-12 px-8 text-lg font-bold rounded-xl bg-slate-900 hover:bg-slate-800" onClick={handleSearch}>
                    <Search className="w-5 h-5 mr-2" />
                    Find Spot
                  </Button>
                </div>

                <div className="mt-8 flex items-center gap-6 text-sm text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-500" /> Verified Spots
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" /> Instant Booking
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="w-full lg:w-1/2 relative hidden lg:block">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-pulse delay-1000"></div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100 aspect-video group rotate-2 hover:rotate-0 transition-transform duration-500">
                  <Image src="/parking.png" alt="App Interface" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* --- Stats Section --- */}
        <section className="py-16 border-y border-slate-100 bg-slate-50/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: Users, label: "Happy Drivers", value: "10,000+" },
                { icon: Car, label: "Parking Spots", value: "2,500+" },
                { icon: Building2, label: "Cities Live", value: "3" },
                { icon: Clock, label: "Hours Saved", value: "50k+" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-transform duration-300">
                  <div className="mb-3 p-3 bg-white border border-slate-100 text-blue-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- How It Works --- */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/3">
                <h2 className="text-4xl font-bold mb-6 leading-tight text-slate-900">
                  Parking shouldn't be <br />
                  <span className="text-blue-600">rocket science.</span>
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  We stripped away the chaos. Three simple steps to get you from point A to point Parked.
                </p>
                <Button size="lg" className="rounded-xl px-8 h-12 bg-slate-900 text-white hover:bg-slate-800" onClick={handleSearch}>
                  Start Searching
                </Button>
              </div>
              <div className="lg:w-2/3 grid gap-8">
                {[
                  { icon: MapPin, title: "1. Find", desc: "Enter your destination. Compare prices and distance instantly." },
                  { icon: ShieldCheck, title: "2. Reserve", desc: "Book your spot in advance. Your space is guaranteed." },
                  { icon: Zap, title: "3. Arrive", desc: "Drive in. Scan the QR code. No circling, no cash, no stress." }
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors duration-300 border border-transparent hover:border-slate-100">
                    <div className="flex-shrink-0 w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-slate-900">{step.title}</h3>
                      <p className="text-slate-600 leading-relaxed max-w-md">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- Seller Section --- */}
        <section className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4">
            <div className="bg-slate-900 rounded-3xl p-8 md:p-16 text-white overflow-hidden relative shadow-2xl">
              <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Earn from your empty space</h2>
                  <p className="text-slate-300 text-lg mb-10 leading-relaxed">
                    Got a driveway, garage, or empty lot? Turn it into passive income.
                    It takes less than 5 minutes to list.
                  </p>
                  <Button size="lg" variant="secondary" className="text-slate-900 font-bold text-lg px-8 h-14 rounded-xl" onClick={() => router.push("/list-spot")}>
                    List Your Spot <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
                <div className="hidden lg:flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                  <div className="relative bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-2xl w-full max-w-md transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-2xl">💰</div>
                      <div>
                        <div className="text-sm text-slate-300 uppercase font-bold tracking-wider">This Week's Earnings</div>
                        <div className="text-3xl font-bold">₹12,450</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 bg-white/20 rounded-full w-full"></div>
                      <div className="h-2 bg-white/20 rounded-full w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Testimonials --- */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-slate-900">Loved by drivers & hosts</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Rohan K.", role: "Daily Commuter", text: "Saved me 20 mins every morning. I have a guaranteed spot near my office now." },
                { name: "Priya M.", role: "Weekend Shopper", text: "Finally, I don't have to fight for parking at the mall. Worth every rupee." },
                { name: "Amit S.", role: "Host", text: "I make ₹5k a month from my empty driveway. The passive income is great." }
              ].map((t, i) => (
                <div key={i} className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                  <div className="flex gap-1 mb-6 text-yellow-400">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-slate-700 mb-6 leading-relaxed text-lg">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Partner & App --- */}
        <section className="py-24 bg-white border-t border-slate-100">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-blue-50 rounded-3xl p-10 md:p-14 flex flex-col justify-center border border-blue-100">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-8 text-blue-600">
                  <Building2 className="w-7 h-7" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-slate-900">Partner with ParkEase</h3>
                <p className="text-slate-600 mb-8 text-lg">
                  Own a parking lot, mall, or hotel? Optimize your inventory with our B2B tools.
                </p>
                <Button variant="outline" className="self-start border-blue-200 hover:bg-blue-100 text-blue-700 font-bold h-12 px-6 rounded-xl bg-white">
                  Contact Sales
                </Button>
              </div>
              <div className="bg-slate-900 rounded-3xl p-10 md:p-14 flex flex-col justify-center text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-8 text-white">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">Park on the go</h3>
                  <p className="text-slate-300 mb-8 text-lg">
                    Get the full experience. Book spots, track payments, and navigate effortlessly.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-white text-slate-900 hover:bg-slate-100 h-12 px-6 rounded-xl font-bold">
                      <Apple className="w-5 h-5 mr-2" /> App Store
                    </Button>
                    <Button className="bg-transparent border border-slate-600 text-white hover:bg-slate-800 h-12 px-6 rounded-xl font-bold">
                      <Smartphone className="w-5 h-5 mr-2" /> Google Play
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* --- Footer --- */}
      <footer className="bg-white border-t border-slate-100 py-16 text-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
                <span className="font-bold text-xl text-slate-900">ParkEase</span>
              </div>
              <p className="text-slate-500 max-w-xs leading-relaxed">
                Reclaiming public space, one parking spot at a time.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-slate-900">Company</h4>
              <ul className="space-y-4 text-slate-600">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-slate-900">Legal</h4>
              <ul className="space-y-4 text-slate-600">
                <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 text-center text-slate-400">
            © {new Date().getFullYear()} ParkEase Inc.
          </div>
        </div>
      </footer>

      <LoginModal isOpen={showLogin} onOpenChange={setShowLogin} />
    </div>
  );
}
