"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { toast } from "sonner"; // <--- Import sonner toast

export function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [loading, setLoading] = useState(false);

  // Form State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSendOtp = async () => {
    // 1. Remove spaces/dashes to get raw digits
    let cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '');

    // 2. Auto-format for India (+91) if only 10 digits are provided
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('+')) {
      cleanPhone = `+91${cleanPhone}`;
    }
    // 3. Ensure it starts with '+' if it's a full number (e.g. 9198765...)
    else if (cleanPhone.length > 10 && !cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    // 4. Validate E.164 format (Simple check: must start with + and have >10 chars)
    if (!cleanPhone.startsWith('+') || cleanPhone.length < 12) {
      toast.error("Please enter a valid mobile number with country code (e.g., 9876543210).");
      return;
    }

    setLoading(true);
    try {
      // Send the CLEAN phone number to the API
      await api.post("/auth/register-with-phone", { phone: cleanPhone });

      // Update the state so the next step uses the formatted number too
      setPhone(cleanPhone);

      toast.success("OTP sent via SMS!", { description: "Check your phone." });
      setStep("OTP");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error("Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        phone,
        otp,
        name: name || "New User",
      });

      // Save to store
      setAuth(res.data.access_token, res.data.user);
      setIsOpen(false);
      toast.success("Welcome back!", { description: `Logged in as ${res.data.user.name}` });
    } catch (error) {
      console.error(error);
      toast.error("Invalid OTP or Login Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Log In</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{step === "PHONE" ? "Log in or Sign up" : "Verify Mobile"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {step === "PHONE" ? (
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="9999999999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button onClick={handleSendOtp} disabled={loading}>
                {loading ? "Sending..." : "Continue"}
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                placeholder="Check server console..."
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Label htmlFor="name">Your Name (For new accounts)</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button onClick={handleVerifyOtp} disabled={loading}>
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
