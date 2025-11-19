"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
// Update imports to include the new updateUserProfile
import { api, loginWithPassword, requestLoginOtp, updateUserProfile } from "@/lib/api";
import { toast } from "sonner";
import axios from "axios";
import {
  Smartphone,
  Mail,
  ChevronLeft,
  Loader2,
  Check,
  X,
  Eye,
  EyeOff
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
    defaultMode?: "login" | "signup";
}

export function LoginModal({ isOpen, onOpenChange }: LoginModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const show = isOpen ?? internalOpen;
  const setShow = onOpenChange ?? setInternalOpen;

  const [step, setStep] = useState<FlowStep>("WELCOME");
  const [loading, setLoading] = useState(false);

  // Prevent multiple API calls
  const requestInProgress = useRef(false);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [phone, setPhone] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const [isNewUser, setIsNewUser] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const standardizePhone = (p: string) => {
    let clean = p.replace(/\D/g, '');
    if (clean.length === 10) clean = `91${clean}`;
    return `+${clean}`;
  };

  const getOtpString = () => otpValues.join("");

  // Reset on close
  useEffect(() => {
    if (!show) {
        setTimeout(() => {
            setStep("WELCOME");
            setPhone("");
            setOtpValues(["", "", "", "", "", ""]);
            setName("");
            setEmail("");
            setPassword("");
            setLoading(false);
            requestInProgress.current = false;
        }, 300);
    }
  }, [show]);

  // --- OTP Input Logic ---
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

  // --- 1. Send OTP (Fixed Multiple Request Issue) ---
  const handlePhoneSubmit = async () => {
    if (requestInProgress.current) return; // Stop if already sending

    const cleanPhone = standardizePhone(phone);
    if (cleanPhone.length < 12) {
        toast.error("Please enter a valid mobile number");
        return;
    }

    setLoading(true);
    requestInProgress.current = true; // LOCK

    try {
        // Try to register (initiate signup flow)
        await api.post("/auth/register-with-phone", { phone: cleanPhone });

        setIsNewUser(true);
        setStep("OTP_INPUT");
        toast.success("Verification code sent.");
        // Clear OTPs on new send/resend
        setOtpValues(["", "", "", "", "", ""]);

    } catch (error: any) {
        if (error.response?.status === 409) {
            // User EXISTS -> Login Flow
            setIsNewUser(false);
            try {
                await requestLoginOtp({ phone: cleanPhone });
                setStep("OTP_INPUT");
                toast.info("Welcome back! Enter OTP to login.");
                setOtpValues(["", "", "", "", "", ""]);
            } catch (loginErr) {
                toast.error("Failed to send code. Try again.");
            }
        } else {
            toast.error("Network error. Please try again.");
        }
    } finally {
        setLoading(false);
        requestInProgress.current = false; // UNLOCK
    }
  };

  // --- 2. Verify OTP (The "Verify First" Flow) ---
  const handleOtpSubmit = async () => {
    const finalOtp = getOtpString();
    if (finalOtp.length !== 6) return;

    setLoading(true);
    try {
        // We Verify IMMEDIATELY for both Login and Signup.
        // verify-otp creates the user in DB (if new) and returns a token.
        const res = await api.post("/auth/verify-otp", {
            phone: standardizePhone(phone),
            otp: finalOtp,
            name: "Driver", // Placeholder for now
        });

        // Save the token! We need it for the next steps.
        setAuth(res.data.access_token, res.data.user);

        if (isNewUser) {
            // If it was a Signup flow, we now have a "Partial User".
            // Move to details to complete the profile.
            toast.success("Verified! Now lets set up your profile.");
            setStep("USER_DETAILS");
        } else {
            // Existing user -> Done.
            setShow(false);
            toast.success("Welcome back!");
            router.push("/dashboard");
        }
    } catch (error) {
        toast.error("Invalid code. Please try again.");
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

  // --- 4. Final Profile Update (Using the Token) ---
  const handleFinalSignup = async () => {
    setLoading(true);
    try {
        // We use the token we got in Step 2 to update the user
        await updateUserProfile({
            name,
            email,
            password
        });

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

  // --- Render ---
  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl gap-0 bg-white text-slate-900">

        {/* Header */}
        <DialogHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
            {step !== "WELCOME" && (
                <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100" onClick={() => {
                    if (step === "OTP_INPUT") setStep("WELCOME");
                    // If going back from details, we are already logged in via OTP.
                    // Warn user or allow them to just stay logged in as "Driver"?
                    // For simplicity, we let them go back to edit details.
                    if (step === "USER_DETAILS") setStep("OTP_INPUT"); // Visual back only
                    if (step === "CREATE_PASS") setStep("USER_DETAILS");
                    if (step === "EMAIL_LOGIN") setStep("WELCOME");
                }}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
            )}
            <DialogTitle className="text-base font-bold w-full text-center mr-6 text-slate-800">
                {step === "WELCOME" && "Log in or sign up"}
                {step === "OTP_INPUT" && "Verify phone number"}
                {step === "USER_DETAILS" && "Add your details"}
                {step === "CREATE_PASS" && "Set a password"}
                {step === "EMAIL_LOGIN" && "Log in"}
            </DialogTitle>
        </DialogHeader>

        <div className="p-6">
            {/* 1. WELCOME (Phone) */}
            {step === "WELCOME" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-xl font-semibold text-slate-900">Welcome to ParkEase</h3>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <span className="text-slate-500 font-medium border-r border-slate-300 pr-2 mr-2">+91</span>
                        </div>
                        <Input
                            autoFocus
                            placeholder="Phone number"
                            className="pl-14 h-12 text-lg bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        We'll call or text you to confirm your number. Standard message and data rates apply.
                    </p>
                    <Button
                        className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        onClick={handlePhoneSubmit}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                    </Button>
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-medium">or</span></div>
                    </div>
                    <Button variant="outline" className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium" onClick={() => setStep("EMAIL_LOGIN")}>
                        <Mail className="w-5 h-5 mr-2 text-slate-500" />
                        Continue with Email
                    </Button>
                </div>
            )}

            {/* 2. OTP INPUT */}
            {step === "OTP_INPUT" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="text-sm text-slate-600">
                        Enter the 6-digit code sent to <span className="font-bold text-slate-900">{phone}</span>.
                    </div>
                    <div className="flex justify-between gap-2">
                        {otpValues.map((digit, index) => (
                            <Input
                                key={index}
                                ref={(el) => { otpRefs.current[index] = el }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                onPaste={handleOtpPaste}
                                className="w-12 h-12 text-center text-xl font-semibold bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all rounded-lg"
                            />
                        ))}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <button className="font-semibold text-slate-800 hover:underline" onClick={handlePhoneSubmit}>Resend SMS</button>
                    </div>
                    <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-lg" onClick={handleOtpSubmit} disabled={loading || otpValues.some(d => d === "")}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                    </Button>
                </div>
            )}

            {/* 3. USER DETAILS */}
            {step === "USER_DETAILS" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-slate-600">Full Name</Label>
                            <Input autoFocus placeholder="e.g. Rohan Kumar" className="h-11 bg-slate-50 border-slate-200" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-slate-600">Email</Label>
                            <Input type="email" placeholder="rohan@example.com" className="h-11 bg-slate-50 border-slate-200" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>
                    <Button className="w-full h-12 mt-2 bg-blue-600 hover:bg-blue-700 rounded-lg" onClick={handleDetailsSubmit} disabled={!name || !email}>
                        Continue
                    </Button>
                </div>
            )}

            {/* 4. CREATE PASSWORD */}
            {step === "CREATE_PASS" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                        <Label className="text-slate-600">Create a password</Label>
                        <div className="relative">
                            <Input
                                autoFocus
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="h-12 pr-10 bg-slate-50 border-slate-200"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password Strength</p>
                        {passChecks.map((check, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm transition-all duration-200">
                                <div className={`rounded-full p-0.5 ${check.valid ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-400"}`}>
                                    {check.valid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                </div>
                                <span className={check.valid ? "text-slate-700 font-medium" : "text-slate-400"}>{check.label}</span>
                            </div>
                        ))}
                    </div>
                    <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all" onClick={handleFinalSignup} disabled={loading || !isPasswordValid}>
                         {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Agree and Join"}
                    </Button>
                </div>
            )}

            {/* 5. EMAIL LOGIN */}
            {step === "EMAIL_LOGIN" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                        <Input autoFocus placeholder="Email" type="email" className="h-12 bg-slate-50 border-slate-200" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                        <Input placeholder="Password" type="password" className="h-12 bg-slate-50 border-slate-200" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
                    </div>
                    <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-lg" onClick={() => {
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
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log in"}
                    </Button>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
