"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { api, loginWithPassword, signup, requestLoginOtp } from "@/lib/api";
import { toast } from "sonner";
import axios from "axios";

// Updated Step types
type AuthStep =
  | "LOGIN_PHONE"
  | "SIGNUP_PHONE"
  | "SIGNUP_VERIFY_AND_DETAILS"
  | "SIGNUP_PASSWORD"
  | "LOGIN_EMAIL";

export function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<AuthStep>("LOGIN_PHONE");
  const [loading, setLoading] = useState(false);

  // Form State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State to track if phone number failed registration check
  const [phoneError, setPhoneError] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  const resetState = () => {
    setStep("LOGIN_PHONE");
    setPhone("");
    setOtp("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setLoading(false);
    setPhoneError(false);
  }

  // Intercept open/close to reset state when closed
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  }

  // Helper to standardize phone number (mirrors backend logic)
  const standardizePhone = (p: string) => {
    let cleanPhone = p.replace(/\s+/g, '').replace(/-/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('+')) {
      cleanPhone = `+91${cleanPhone}`;
    } else if (cleanPhone.length > 10 && !cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }
    return cleanPhone;
  }

  // --- OTP Handlers ---

  const handleSendOtp = async (nextStep: AuthStep) => {
    const cleanPhone = standardizePhone(phone);

    if (!cleanPhone.startsWith('+') || cleanPhone.length < 12) {
      toast.error("Please enter a valid mobile number (e.g., 9876543210).");
      return;
    }

    setPhoneError(false); // Clear error before attempting API call
    setLoading(true);
    try {
      await api.post("/auth/register-with-phone", { phone: cleanPhone });

      // On SUCCESS (User is new):
      setPhone(cleanPhone);
      toast.success("Verification code sent!", { description: "Check your phone." });
      setStep(nextStep);
    } catch (error) {
      // Use axios.isAxiosError for guaranteed type narrowing and status code access
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        // On CONFLICT (Account Exists): This is the correct behavior for SIGNUP flow.
        toast.info("Account found! Please log in instead.");
        setPhoneError(true);
      } else if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.detail || "Failed to send code. Please check your number.");
      } else {
        toast.error("An unknown network error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginVerifyOtp = async () => {
    // 1. Common validation
    const cleanPhone = standardizePhone(phone);
    if (!cleanPhone.startsWith('+') || cleanPhone.length < 12) {
      toast.error("Please enter a valid mobile number.");
      return;
    }

    // DUAL ACTION LOGIC
    if (!otp) {
      // ACTION 1: OTP field is EMPTY -> Send OTP for LOGIN
      setLoading(true);
      try {
        // FIX: Use the new Login-specific endpoint
        await requestLoginOtp({ phone: cleanPhone });

        // SUCCESS: OTP actually sent this time
        toast.success("OTP sent! Please enter the code to log in.");
      } catch (error: any) {
        toast.error(error.response?.data?.detail || "Failed to send code.");
      }
      setLoading(false);
      return;
    }

    // CRITICAL FIX: DUAL ACTION LOGIC
    if (!otp) {
      // ACTION 1: OTP field is EMPTY -> Send OTP
      setLoading(true);
      try {
        await api.post("/auth/register-with-phone", { phone: cleanPhone });
        // SUCCESS: OTP sent (user is new)
        toast.success("OTP sent! Please enter the code to log in.");
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          // CONFLICT: User is existing, backend blocked OTP.
          // Since this is the LOGIN screen, we prompt user to enter the code now.
          toast.info("Account found. Enter OTP to log in.");
        } else {
          toast.error(error.response?.data?.detail || "Failed to send code.");
        }
      }
      setLoading(false);
      return;
    }



    // ACTION 2: OTP field is FULL -> Verify OTP
    setLoading(true);
    try {
      // Use existing /verify-otp for quick login/driver registration (if account exists)
      const res = await api.post("/auth/verify-otp", {
        phone: cleanPhone,
        otp,
        name: "Driver", // Placeholder, API creates if needed
      });

      setAuth(res.data.access_token, res.data.user);
      setIsOpen(false);
      toast.success("Welcome back!", { description: `Logged in as ${res.data.user.name}` });
    } catch (error: any) {
      if (error.response?.data?.detail === "Invalid or expired OTP") {
        toast.error("Invalid OTP or Login Failed.");
      } else {
        toast.error(error.response?.data?.detail || "Login Failed.");
      }

    } finally {
      setLoading(false);
    }
  };

  // --- Final Registration Handler (New Flow) ---

  const handleFinalRegister = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (!name || !email || !otp) {
      toast.error("All fields (OTP, Name, Email) are required.");
      return;
    }

    setLoading(true);
    try {
      // API call that consumes the OTP
      const res = await signup({
        phone,
        otp,
        name,
        email,
        password,
        confirm_password: confirmPassword
      });

      // Save to store
      setAuth(res.data.access_token, res.data.user);
      setIsOpen(false);
      toast.success("Welcome to ParkEase!", { description: `Account created for ${res.data.user.name}` });
    } catch (error: any) {
      // This error block catches the "Invalid or expired OTP"
      toast.error(error.response?.data?.detail || "Registration failed. Please try sending OTP again.");
      console.error(error.response?.data?.detail);
    } finally {
      setLoading(false);
    }
  }

  // --- Email/Password Login Handler ---

  const handleEmailPasswordLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await loginWithPassword({ email, password });
      setAuth(res.data.access_token, res.data.user);
      setIsOpen(false);
      toast.success("Welcome!", { description: `Logged in as ${res.data.user.name}` });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  // --- Render Logic ---

  let modalTitle = "Log In";
  let content = null;

  switch (step) {
    case "LOGIN_PHONE":
      modalTitle = "Log In";
      content = (
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground -mt-2">Use OTP to quickly log in or create a basic driver account.</p>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="9999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="otp">OTP (Check server console/SMS)</Label>
            <Input
              id="otp"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <Button onClick={handleLoginVerifyOtp} disabled={loading}>
              {/* Button text is static now, functionality is dual */}
              {loading
                ? (!otp ? "Sending OTP..." : "Verifying...")
                : "Log In / Get OTP"}
            </Button>
          </div>

          <div className="flex justify-between items-center mt-2">
            <Button variant="link" onClick={() => setStep("LOGIN_EMAIL")} className="p-0">Log in with Email</Button>
            <Button variant="link" onClick={() => setStep("SIGNUP_PHONE")} className="p-0">Not a user? Sign up</Button>
          </div>
        </div>
      );
      break;

    case "SIGNUP_PHONE":
      modalTitle = "Sign Up: Step 1/3 (Phone)";
      content = (
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">Phone number is mandatory for account verification.</p>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError(false); // Clear error as soon as user types
              }}
              // CRITICAL FIX: Conditional styling for phone error
              className={phoneError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {/* Show an error message when phoneError is true */}
            {phoneError && (
              <p className="text-sm text-red-500">This number is already registered. Please log in.</p>
            )}
            <Button onClick={() => handleSendOtp("SIGNUP_VERIFY_AND_DETAILS")} disabled={loading || phoneError}>
              {loading ? "Sending Code..." : "Send Verification Code"}
            </Button>
          </div>
          <Button variant="link" onClick={() => resetState()}>← Back to Login</Button>
        </div>
      );
      break;

    case "SIGNUP_VERIFY_AND_DETAILS": // <-- NEW MERGED STEP (Step 2/3)
      modalTitle = "Sign Up: Step 2/3 (Verify Code & Details)";
      content = (
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to **{phone}**.</p>
          {/* OTP Input */}
          <div className="grid gap-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 my-2">
            <div className="flex-grow border-t border-muted-foreground/30"></div>
            <span className="text-sm text-muted-foreground">AND</span>
            <div className="flex-grow border-t border-muted-foreground/30"></div>
          </div>
          {/* Details Inputs */}
          <p className="text-sm text-muted-foreground -mt-2">Name and Email are required.</p>
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Rohan Kumar" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {/* Button to proceed to password, using OTP, Name, and Email data */}
          <Button onClick={() => setStep("SIGNUP_PASSWORD")} disabled={!otp || !name || !email}>
            Continue to Password (Step 3/3)
          </Button>
          <Button variant="link" onClick={() => setStep("SIGNUP_PHONE")}>← Change Phone</Button>
        </div>
      );
      break;

    case "SIGNUP_PASSWORD":
      modalTitle = "Sign Up: Step 3/3 (Password)";
      content = (
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">Password must be at least 6 characters long and complex.</p>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={handleFinalRegister} disabled={loading}>
            {loading ? "Creating Account..." : "Complete Sign Up"}
          </Button>
          <Button variant="link" onClick={() => setStep("SIGNUP_VERIFY_AND_DETAILS")}>← Back to Details</Button>
        </div>
      );
      break;

    // --- LOGIN FLOWS ---
    case "LOGIN_EMAIL":
      modalTitle = "Log In with Email";
      content = (
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground -mt-2">Use this for B2B/Seller accounts.</p>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="operator@mall.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={handleEmailPasswordLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
          <Button variant="link" onClick={() => resetState()}>← Back to Phone Login</Button>
        </div>
      );
      break;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Log In</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        {content}
      </DialogContent>
    </Dialog>
  );
}
