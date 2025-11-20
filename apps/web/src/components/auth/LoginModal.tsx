// apps/web/src/components/auth/LoginModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Added for Terms links
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
  ShieldCheck
} from "lucide-react";

type FlowStep =
  | "WELCOME"
  | "OTP_INPUT"
  | "USER_DETAILS"
  | "CREATE_PASS"
  | "EMAIL_LOGIN";

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
  const requestLock = useRef(false);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Data State
  const [phone, setPhone] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Legal Compliance State
  const [agreedToTerms, setAgreedToTerms] = useState(false); // NEW

  const [isNewUser, setIsNewUser] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const standardizePhone = (p: string) => {
    let clean = p.replace(/\D/g, '');
    if (clean.length === 10) clean = `91${clean}`;
    return `+${clean}`;
  };

  const getOtpString = () => otpValues.join("");

  useEffect(() => {
    if (!show) {
        setTimeout(() => {
            setStep("WELCOME");
            setPhone("");
            setOtpValues(["", "", "", "", "", ""]);
            setName("");
            setEmail("");
            setPassword("");
            setAgreedToTerms(false); // Reset
            setLoading(false);
            requestLock.current = false;
        }, 300);
    }
  }, [show]);

  // --- OTP Logic ---
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.substring(value.length - 1);
    setOtpValues(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pastedData.every(char => !isNaN(Number(char)))) {
        const newOtp = [...otpValues];
        pastedData.forEach((char, i) => { if (i < 6) newOtp[i] = char; });
        setOtpValues(newOtp);
        otpRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  // --- 1. Send OTP ---
  const handlePhoneSubmit = async () => {
    if (requestLock.current) return;

    const cleanPhone = standardizePhone(phone);
    if (cleanPhone.length < 12) {
        toast.error("Please enter a valid mobile number");
        return;
    }

    setLoading(true);
    requestLock.current = true;
    setOtpValues(["", "", "", "", "", ""]);

    try {
        await api.post("/auth/register-with-phone", { phone: cleanPhone });
        setIsNewUser(true);
        setStep("OTP_INPUT");
        toast.success("Verification code sent.");
    } catch (error: any) {
        if (error.response?.status === 409) {
            setIsNewUser(false);
            try {
                await requestLoginOtp({ phone: cleanPhone });
                setStep("OTP_INPUT");
                toast.info("Welcome back! Enter OTP to login.");
            } catch (loginErr) {
                toast.error("Failed to send code.");
            }
        } else {
            toast.error("Network error.");
        }
    } finally {
        setLoading(false);
        requestLock.current = false;
    }
  };

  // --- 2. Verify OTP ---
  const handleOtpSubmit = async () => {
    const finalOtp = getOtpString();
    if (finalOtp.length !== 6) return;
    setLoading(true);
    try {
        const res = await api.post("/auth/verify-otp", {
            phone: standardizePhone(phone),
            otp: finalOtp,
            name: "Driver",
        });
        setAuth(res.data.access_token, res.data.user);
        if (isNewUser) {
            toast.success("Verified! Setup your profile.");
            setStep("USER_DETAILS");
        } else {
            setShow(false);
            toast.success("Welcome back!");
            router.push("/dashboard");
        }
    } catch (error) {
        toast.error("Invalid code or expired.");
    } finally {
        setLoading(false);
    }
  };

  // --- 3. Details Submit ---
  const handleDetailsSubmit = () => {
      if (!name || !email) {
          toast.error("Please fill in all fields");
          return;
      }
      setStep("CREATE_PASS");
  }

  // --- 4. Final Profile ---
  const handleFinalSignup = async () => {
    if (!agreedToTerms) {
        toast.error("You must agree to the terms to continue.");
        return;
    }

    setLoading(true);
    try {
        await updateUserProfile({ name, email, password });
        setShow(false);
        toast.success("Account created successfully!");
        router.push("/dashboard");
    } catch (error: any) {
        toast.error(error.response?.data?.detail || "Failed to update profile.");
    } finally {
        setLoading(false);
    }
  };

  // --- Helpers ---
  const passChecks = [
      { label: "At least 6 characters", valid: password.length >= 6 },
      { label: "Contains a number", valid: /\d/.test(password) },
      { label: "Contains a lowercase letter", valid: /[a-z]/.test(password) },
  ];
  const isPasswordValid = passChecks.every(c => c.valid);

  // --- BRAND COMPONENTS ---
  const BrandHeader = () => (
      <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">ParkEase</span>
      </div>
  );

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl gap-0 bg-white text-slate-900 shadow-2xl border-slate-100">

        <DialogTitle className="sr-only">
            {step === "WELCOME" ? "Log in or Sign up" : "Authentication"}
        </DialogTitle>

        {/* Header Navigation */}
        <div className="px-4 pt-4 flex justify-between items-center">
            {step !== "WELCOME" ? (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500" onClick={() => {
                    if (step === "OTP_INPUT") setStep("WELCOME");
                    if (step === "USER_DETAILS") setStep("OTP_INPUT");
                    if (step === "CREATE_PASS") setStep("USER_DETAILS");
                    if (step === "EMAIL_LOGIN") setStep("WELCOME");
                }}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
            ) : (
                <div className="w-8" /> // Spacer
            )}
        </div>

        <div className="px-8 pb-10 pt-2">

            {/* 1. WELCOME */}
            {step === "WELCOME" && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-center space-y-2">
                        <BrandHeader />
                        <h3 className="text-2xl font-extrabold tracking-tight">Welcome back</h3>
                        <p className="text-slate-500 text-sm">Login or sign up to book your spot.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <span className="text-slate-500 font-bold border-r border-slate-300 pr-3 mr-1">+91</span>
                            </div>
                            <Input
                                autoFocus
                                placeholder="Mobile Number"
                                className="pl-16 h-14 text-lg bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                            onClick={handlePhoneSubmit}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Continue"}
                        </Button>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-wider">or</span></div>
                    </div>

                    <Button variant="outline" className="w-full h-14 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-semibold transition-colors" onClick={() => setStep("EMAIL_LOGIN")}>
                        <Mail className="w-5 h-5 mr-2 text-slate-500" />
                        Continue with Email
                    </Button>
                </div>
            )}

            {/* 2. OTP INPUT */}
            {step === "OTP_INPUT" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
                     <div className="text-center">
                        <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold">Verify your number</h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Enter the code sent to <span className="font-bold text-slate-900">{phone}</span>
                        </p>
                    </div>

                    <div className="flex justify-between gap-2">
                        {otpValues.map((digit, index) => (
                            <Input
                                autoFocus={index === 0}
                                key={index}
                                ref={(el) => { otpRefs.current[index] = el }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                onPaste={handleOtpPaste}
                                className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border-slate-200 focus:border-blue-600 focus:ring-0 focus:bg-white transition-all rounded-lg caret-blue-600"
                            />
                        ))}
                    </div>

                    <Button
                        className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg transition-all"
                        onClick={handleOtpSubmit}
                        disabled={loading || otpValues.some(d => d === "")}
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify & Continue"}
                    </Button>
                </div>
            )}

            {/* 3. USER DETAILS */}
            {step === "USER_DETAILS" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold">Almost there</h3>
                        <p className="text-slate-500 text-sm">Finish setting up your account.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-slate-600 ml-1">Full Name</Label>
                            <Input autoFocus placeholder="e.g. Rohan Kumar" className="h-12 bg-slate-50 border-slate-200 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-slate-600 ml-1">Email</Label>
                            <Input type="email" placeholder="rohan@example.com" className="h-12 bg-slate-50 border-slate-200 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>
                    <Button className="w-full h-14 mt-4 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={handleDetailsSubmit} disabled={!name || !email}>
                        Next Step
                    </Button>
                </div>
            )}

            {/* 4. CREATE PASSWORD */}
            {step === "CREATE_PASS" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="text-center mb-2">
                        <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold">Secure your account</h3>
                    </div>

                    <div className="relative">
                        <Input
                            autoFocus
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            className="h-14 pr-12 bg-slate-50 border-slate-200 rounded-xl text-lg"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Password Requirements */}
                    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Requirements</p>
                        {passChecks.map((check, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm transition-all duration-200">
                                <div className={`rounded-full p-1 ${check.valid ? "bg-green-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                                    <Check className="w-3 h-3" />
                                </div>
                                <span className={check.valid ? "text-slate-700 font-medium" : "text-slate-400"}>{check.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Legal Compliance Checkbox */}
                    <div className="flex items-start space-x-3 px-1 pt-2">
                        <input
                            type="checkbox"
                            id="terms"
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                        />
                        <label htmlFor="terms" className="text-sm text-slate-500 leading-tight">
                            I agree to the <Link href="/terms" className="text-blue-600 underline hover:text-blue-800">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 underline hover:text-blue-800">Privacy Policy</Link>.
                        </label>
                    </div>

                    <Button
                        className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-600/20"
                        onClick={handleFinalSignup}
                        disabled={loading || !isPasswordValid || !agreedToTerms}
                    >
                         {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create Account"}
                    </Button>
                </div>
            )}

            {/* 5. EMAIL LOGIN */}
            {step === "EMAIL_LOGIN" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold">Welcome back</h3>
                        <p className="text-slate-500 text-sm">Login with your email.</p>
                    </div>
                    <div className="space-y-4">
                        <Input autoFocus placeholder="Email address" type="email" className="h-14 bg-slate-50 border-slate-200 rounded-xl" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                        <Input placeholder="Password" type="password" className="h-14 bg-slate-50 border-slate-200 rounded-xl" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
                    </div>
                    <Button className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => {
                        setLoading(true);
                        loginWithPassword({ email: loginEmail, password: loginPass })
                            .then(res => {
                                setAuth(res.access_token, res.user);
                                setShow(false);
                                toast.success("Logged in!");
                                router.push("/dashboard");
                            })
                            .catch(() => {
                                toast.error("Invalid credentials");
                                setLoading(false);
                            });
                    }} disabled={loading}>
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Log in"}
                    </Button>
                </div>
            )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
