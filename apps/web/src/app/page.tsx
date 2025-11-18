import { SearchBar } from "@/components/search/SearchBar";
import { LoginModal } from "@/components/auth/LoginModal";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-50">
      <div className="absolute top-4 right-4">
        <LoginModal />
      </div>

      <h1 className="text-5xl font-bold mb-4 text-slate-900 tracking-tight">ParkEase</h1>
      <p className="text-xl mb-12 text-slate-600">Guaranteed parking. No more tension.</p>

      <SearchBar />
    </main>
  );
}
