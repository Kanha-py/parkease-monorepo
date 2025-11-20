"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { api, loginWithPassword, requestLoginOtp, updateUserProfile } from "@/lib/api";
import { toast } from "sonner";
import {
  Smartphone,
  Mail,
  ChevronLeft,
  Loader2,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight
} from "lucide-react";

type FlowStep = "WELCOME" | "OTP_INPUT" | "USER_DETAILS" | "CREATE_PASS" | "EMAIL_LOGIN";

interface LoginModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LoginModal({ isOpen, onOpenChange }: LoginModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const show = isOpen ?? internalOpen;
  const setShow = onOpenChange ?? setInternalOpen;

  const [step, setStep] = useState<FlowStep>("WELCOME");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Form State
  const [phone, setPhone] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state on close
  useEffect(() => {
    if (!show) {
      setTimeout(() => {
        setStep("WELCOME");
        setPhone("");
        setOtpValues(["", "", "", "", "", ""]);
        setLoading(false);
      }, 300);
    }
  }, [show]);

  // --- Logic ---
  const standardizePhone = (p: string) => {
    let clean = p.replace(/\D/g, '');
    if (clean.length === 10) clean = `91${clean}`;
    return `+${clean}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.substring(value.length - 1);
    setOtpValues(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handlePhoneSubmit = async () => {
    const cleanPhone = standardizePhone(phone);
    if (cleanPhone.length < 12) { toast.error("Invalid number"); return; }
    setLoading(true);
    try {
      await api.post("/auth/register-with-phone", { phone: cleanPhone });
      setIsNewUser(true);
      setStep("OTP_INPUT");
      toast.success("Code sent!");
    } catch (error: any) {
      if (error.response?.status === 409) {
        setIsNewUser(false);
        await requestLoginOtp({ phone: cleanPhone });
        setStep("OTP_INPUT");
        toast.info("Welcome back!");
      } else {
        toast.error("Error sending code");
      }
    } finally { setLoading(false); }
  };

  const handleOtpSubmit = async () => {
    const finalOtp = otpValues.join("");
    if (finalOtp.length !== 6) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        phone: standardizePhone(phone), otp: finalOtp, name: "Driver",
      });
      setAuth(res.data.access_token, res.data.user);
      if (isNewUser) {
        setStep("USER_DETAILS");
      } else {
        setShow(false);
        toast.success("Logged in!");
        router.push("/dashboard");
      }
    } catch (error) { toast.error("Invalid code"); } finally { setLoading(false); }
  };

  const handleFinalSignup = async () => {
    if (!agreedToTerms) return;
    setLoading(true);
    try {
      await updateUserProfile({ name, email, password });
      setShow(false);
      toast.success("Account created!");
      router.push("/dashboard");
    } catch (e) { toast.error("Failed to create account"); } finally { setLoading(false); }
  };

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-3xl bg-white border-0 shadow-2xl">

        <DialogTitle className="sr-only">Login</DialogTitle>

        {/* Header Nav */}
        <div className="px-6 pt-6 flex items-center">
          {step !== "WELCOME" && (
            <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8 rounded-full hover:bg-slate-100" onClick={() => setStep("WELCOME")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="px-8 pb-10 pt-2">

          {/* 1. WELCOME */}
          {step === "WELCOME" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome to ParkEase</h2>
                <p className="text-slate-500 text-sm">Login to book spots, manage listings, and more.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Mobile Number</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <span className="text-slate-900 font-semibold border-r border-slate-200 pr-3 mr-1">+91</span>
                    </div>
                    <Input
                      autoFocus
                      className="pl-16 h-12 text-lg font-medium bg-slate-50 border-slate-200 focus:border-slate-900 focus:ring-0 rounded-xl transition-all"
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <Button className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-black text-white rounded-xl shadow-lg shadow-slate-900/20" onClick={handlePhoneSubmit} disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">or</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300" onClick={() => setStep("EMAIL_LOGIN")}>
                  <Mail className="w-5 h-5 mr-2" /> Email
                </Button>
                <Button variant="outline" className="h-12 rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300" disabled>
                  <div className="w-5 h-5 mr-2 bg-slate-900 rounded-full flex items-center justify-center text-[10px] text-white font-serif">G</div> Google
                </Button>
              </div>
            </div>
          )}

          {/* 2. OTP */}
          {step === "OTP_INPUT" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Enter code</h2>
                <p className="text-slate-500 text-sm mt-1">Sent to <span className="font-semibold text-slate-900">{phone}</span></p>
              </div>

              <div className="flex justify-between gap-2">
                {otpValues.map((digit, i) => (
                  <Input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el }}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border-slate-200 focus:border-slate-900 rounded-xl caret-slate-900"
                    maxLength={1}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <Button className="w-full h-12 font-bold bg-slate-900 hover:bg-black rounded-xl" onClick={handleOtpSubmit} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Verify"}
              </Button>
            </div>
          )}

          {/* 3. SETUP PROFILE (New User) */}
          {(step === "USER_DETAILS" || step === "CREATE_PASS") && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Finish signing up</h2>
                <p className="text-slate-500 text-sm">Just a few more details.</p>
              </div>

              {step === "USER_DETAILS" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input className="h-12 bg-slate-50 rounded-xl" placeholder="e.g. Rohan Kumar" value={name} onChange={e => setName(e.target.value)} autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input className="h-12 bg-slate-50 rounded-xl" type="email" placeholder="rohan@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <Button className="w-full h-12 font-bold bg-slate-900 hover:bg-black rounded-xl mt-2" onClick={() => setStep("CREATE_PASS")} disabled={!name || !email}>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Create Password</Label>
                    <div className="relative">
                      <Input
                        className="h-12 bg-slate-50 rounded-xl pr-10"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoFocus
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    <input type="checkbox" id="terms" className="mt-1 rounded border-slate-300 text-slate-900 focus:ring-slate-900" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} />
                    <label htmlFor="terms" className="text-xs text-slate-500 leading-relaxed">
                      I agree to the <Link href="/terms" className="underline text-slate-900">Terms of Service</Link> and <Link href="/privacy" className="underline text-slate-900">Privacy Policy</Link>.
                    </label>
                  </div>

                  <Button className="w-full h-12 font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-600/20" onClick={handleFinalSignup} disabled={loading || !agreedToTerms || password.length < 6}>
                    {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 4. EMAIL LOGIN */}
          {step === "EMAIL_LOGIN" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                <p className="text-slate-500 text-sm">Login with your email.</p>
              </div>
              <div className="space-y-4">
                <Input autoFocus placeholder="Email" type="email" className="h-12 bg-slate-50 rounded-xl" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                <Input placeholder="Password" type="password" className="h-12 bg-slate-50 rounded-xl" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
              </div>
              <Button className="w-full h-12 font-bold bg-slate-900 hover:bg-black rounded-xl" onClick={() => {
                setLoading(true);
                loginWithPassword({ email: loginEmail, password: loginPass })
                  .then(res => { setAuth(res.access_token, res.user); setShow(false); toast.success("Logged in!"); router.push("/dashboard"); })
                  .catch(() => { toast.error("Invalid credentials"); setLoading(false); });
              }} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Log in"}
              </Button>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
