"use client"; // Mark as client component for the UserMenu interactivity

import Link from "next/link";
import Image from "next/image";
import { SearchBar } from "@/components/search/SearchBar";
import { UserMenu } from "@/components/layout/UserMenu"; // <--- Using the new Menu
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ShieldCheck,
  Zap,
  MapPin,
  Smartphone,
  Star,
  Building2,
  ArrowRight,
  Apple,
  Clock,
  Users,
  Car,
  Globe // <--- Imported Globe
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-100">

      {/* --- 1. Navigation Bar --- */}
      <header className="w-full py-4 px-6 md:px-12 flex justify-between items-center bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">

        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="h-9 w-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <span className="font-bold text-xl tracking-tight">ParkEase</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">

          {/* Download App (Visible on larger screens) */}
          <Button
            size="sm"
            variant="ghost"
            className="hidden md:flex text-slate-600 hover:bg-slate-100 rounded-full px-4 font-medium"
          >
            Download App
          </Button>

          {/* Globe / Language Selector */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-600 hover:bg-slate-100"
            onClick={() => toast.info("Currency & Language settings coming soon!")}
          >
            <Globe className="w-5 h-5" />
          </Button>

          {/* User Menu (The "Three Line" Dropdown) */}
          <UserMenu />

        </div>
      </header>

      <main className="flex-grow">

        {/* --- 2. Hero Section --- */}
        <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

              {/* Left Column: Search & Headline */}
              <div className="w-full lg:w-1/2 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide mb-6">
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

                {/* Search Component */}
                <div className="w-full max-w-2xl shadow-2xl shadow-blue-900/5 rounded-xl">
                  <SearchBar />
                </div>

                <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-green-500" /> Verified Spots
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-500" /> Instant Booking
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Image */}
              <div className="w-full lg:w-1/2 relative">
                {/* Abstract Shapes */}
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>

                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-100 aspect-square group">
                  <Image
                    src="/parking.png"
                    alt="ParkEase App Screenshot"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* --- 3. Stats Section --- */}
        <section className="py-12 border-y border-slate-100 bg-slate-50/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: Users, label: "Happy Drivers", value: "10,000+" },
                { icon: Car, label: "Parking Spots", value: "2,500+" },
                { icon: Building2, label: "Cities Live", value: "3" },
                { icon: Clock, label: "Hours Saved", value: "50k+" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center text-center">
                  <div className="mb-2 p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 4. How It Works (Vertical) --- */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-16 items-center">

              {/* Title Side */}
              <div className="lg:w-1/3">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  Parking shouldn't be <br />
                  <span className="text-blue-600">rocket science.</span>
                </h2>
                <p className="text-lg text-slate-600 mb-8">
                  We stripped away the chaos. Three simple steps to get you from point A to point Parked.
                </p>
                <Button size="lg" className="rounded-lg px-8">
                  Start Searching
                </Button>
              </div>

              {/* Steps Side */}
              <div className="lg:w-2/3 grid gap-8">
                {[
                  {
                    icon: MapPin,
                    title: "1. Find",
                    desc: "Enter your destination. Compare prices and distance instantly."
                  },
                  {
                    icon: ShieldCheck,
                    title: "2. Reserve",
                    desc: "Book your spot in advance. Your space is guaranteed."
                  },
                  {
                    icon: Zap,
                    title: "3. Arrive",
                    desc: "Drive in. Scan the QR code. No circling, no cash, no stress."
                  }
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-slate-900">{step.title}</h3>
                      <p className="text-slate-600 leading-relaxed max-w-md">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* --- 5. Seller Section --- */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="container mx-auto px-4">
            <div className="bg-slate-900 rounded-2xl p-8 md:p-16 text-white overflow-hidden relative">
              <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Earn from your empty space</h2>
                  <p className="text-slate-300 text-lg mb-8">
                    Got a driveway, garage, or empty lot? Turn it into passive income.
                    It takes less than 5 minutes to list.
                  </p>

                  <div className="space-y-6 mb-8">
                    {[
                      "1. List your spot for free.",
                      "2. Set your own schedule and price.",
                      "3. Get paid automatically every week."
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </div>
                        <span className="text-lg font-medium">{item.slice(3)}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/list-spot">
                    <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 h-12 rounded-lg">
                      Start Earning Now <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>

                <div className="hidden lg:block relative h-full min-h-[400px] bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                   {/* Ensure 'seller-dashboard.png' exists in /public */}
                  <Image
                    src="/seller-dashboard.png"
                    alt="Seller Dashboard Interface"
                    fill
                    className="object-cover object-left-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- 6. Testimonials --- */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Loved by drivers</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Rohan K.", role: "Daily Commuter", text: "Saved me 20 mins every morning. I have a guaranteed spot near my office now." },
                { name: "Priya M.", role: "Weekend Shopper", text: "Finally, I don't have to fight for parking at the mall. Worth every rupee." },
                { name: "Amit S.", role: "Host", text: "I make ₹5k a month from my empty driveway. The passive income is great." }
              ].map((t, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex gap-1 mb-4 text-yellow-400">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-slate-700 mb-6 leading-relaxed">"{t.text}"</p>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 7. Partner & Mobile App --- */}
        <section className="py-20 bg-white border-t">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">

              {/* Partner With Us */}
              <div className="bg-blue-50 rounded-2xl p-8 md:p-12 flex flex-col justify-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Partner with ParkEase</h3>
                <p className="text-slate-600 mb-6">
                  Own a parking lot, mall, or hotel? optimizing your inventory with our B2B tools.
                </p>
                <Button variant="outline" className="self-start border-blue-200 hover:bg-blue-100 text-blue-700 rounded-lg">
                  Contact Sales
                </Button>
              </div>

              {/* Download App */}
              <div className="bg-slate-900 rounded-2xl p-8 md:p-12 flex flex-col justify-center text-white">
                <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-6">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Park on the go</h3>
                <p className="text-slate-300 mb-6">
                  Get the full experience. Book spots, track payments, and navigate effortlessly.
                </p>
                <div className="flex gap-4">
                  <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-lg">
                    <Apple className="w-4 h-4 mr-2" /> App Store
                  </Button>
                  <Button className="bg-transparent border border-slate-600 text-white hover:bg-slate-800 rounded-lg">
                    <Smartphone className="w-4 h-4 mr-2" /> Google Play
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* --- 8. Footer --- */}
      <footer className="bg-slate-50 border-t py-16 text-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <span className="font-bold text-lg tracking-tight block mb-4">ParkEase</span>
              <p className="text-slate-500 max-w-xs">
                Reclaiming public space, one parking spot at a time.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-3 text-slate-600">
                <li><a href="#" className="hover:text-blue-600">About</a></li>
                <li><a href="#" className="hover:text-blue-600">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-3 text-slate-600">
                <li><a href="#" className="hover:text-blue-600">Terms</a></li>
                <li><a href="#" className="hover:text-blue-600">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-600">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 text-center text-slate-400">
            © {new Date().getFullYear()} ParkEase. Built for the future of cities.
          </div>
        </div>
      </footer>
    </div>
  );
}
