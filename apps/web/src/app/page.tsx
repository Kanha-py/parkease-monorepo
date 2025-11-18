import { LoginModal } from "@/components/auth/LoginModal";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">ParkEase</h1>
      <p className="text-lg mb-8">The Anti-Super App Parking Marketplace</p>
      <LoginModal />
    </main>
  );
}
