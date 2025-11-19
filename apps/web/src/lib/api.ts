import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Request Interceptor: Attach Token ---
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response Interceptor: Handle 401 (Auto-Logout) ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired -> Logout user
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// --- Interfaces ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserSignup {
  phone: string;
  otp: string;
  name: string;
  email: string;
  password: string;
  confirm_password: string; // Included for cleaner frontend data handling
}

export interface PricingRule {
  id: string;
  lot_id: string;
  name: string;
  rate: number;
  rate_type: string;
  priority: number;
  is_active: boolean;
}

export const loginWithPassword = async (data: LoginRequest) => {
  // This uses the existing /auth/login-with-password endpoint
  const response = await api.post<Token>("/auth/login-with-password", data);
  return response.data;
};

export const requestLoginOtp = async (data: { phone: string }) => {
  const response = await api.post("/auth/login-request-otp", data);
  return response.data;
};

export const signup = async (data: UserSignup) => {
  // Uses the new kebab-case endpoint
  const response = await api.post<Token>("/auth/signup", data);
  return response.data;
};

export const getPricingRules = async (lotId: string) => {
  const response = await api.get<PricingRule[]>(`/api/b2b/lots/${lotId}/rules`);
  return response.data;
};

export const createPricingRule = async (
  lotId: string,
  data: { name: string; rate: number; priority: number }
) => {
  const response = await api.post<PricingRule>(`/api/b2b/lots/${lotId}/rules`, {
    lot_id: lotId,
    ...data,
    rate_type: "HOURLY",
  });
  return response.data;
};

export const deletePricingRule = async (ruleId: string) => {
  const response = await api.delete(`/api/b2b/rules/${ruleId}`);
  return response.data;
};

export interface UserProfileUpdate {
  name: string;
  email: string;
  password: string;
  default_vehicle_plate?: string;
}

export interface UserRead {
    id: string;
    name: string;
    phone: string;
    email?: string;
    default_vehicle_plate?: string;
}

export interface BookingItem {
  id: string;
  lot_name: string;
  address: string;
  start_time: string;
  end_time: string;
  status: string;
  qr_code_data: string | null;
}

export interface ScanResult {
  success: boolean;
  message: string;
  driver_name?: string;
  vehicle_plate?: string;
}

// --- Redemption Calls ---
export const getMyBookings = async () => {
  const response = await api.get<BookingItem[]>("/api/my-bookings");
  return response.data;
};

export const scanQRCode = async (qrCode: string) => {
  const response = await api.post<ScanResult>("/api/scan", { qr_code: qrCode });
  return response.data;
};

export interface Lot {
  id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface Spot {
  id: string;
  name: string;
  spot_type: string;
}

export interface LotDetails extends Lot {
  spots: Spot[];
}

export interface CreateLotData {
  name: string;
  address: string;
  spot_type: "CAR" | "TWO_WHEELER";
  amenities: string[];
  latitude?: number; // <--- Add this
  longitude?: number; // <--- Add this
}

export interface SearchResult {
  lot_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  rate_type: string;
}

export interface SearchParams {
  lat: number;
  long: number;
  start_time: string;
  end_time: string;
  radius_meters?: number;
}

export interface BookingRequest {
  lot_id: string;
  start_time: string;
  end_time: string;
}

export interface BookingResult {
  booking_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  status: string;
}

// --- API Calls ---

export const createLot = async (data: CreateLotData) => {
  const response = await api.post<Lot>("/lots/", data);
  return response.data;
};

export const updateUserProfile = async (data: UserProfileUpdate) => {
  const response = await api.patch<UserRead>("/auth/profile", data);
  return response.data;
};

export const getMyLots = async () => {
  const response = await api.get<Lot[]>("/lots/my-lots");
  return response.data;
};

export const getLotDetails = async (lotId: string) => {
  const response = await api.get<LotDetails>(`/lots/${lotId}`);
  return response.data;
};

export const setSpotPricing = async (lotId: string, rate: number) => {
  const response = await api.post("/my-spot/pricing", {
    lot_id: lotId,
    rate: rate,
    rate_type: "HOURLY",
  });
  return response.data;
};

export const setSpotAvailability = async (
  spotId: string,
  start: Date,
  end: Date
) => {
  const response = await api.post("/my-spot/availability", {
    spot_id: spotId,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  });
  return response.data;
};

export const searchParking = async (params: SearchParams) => {
  const response = await api.get<SearchResult[]>("/api/search/availability", {
    params: params,
  });
  return response.data;
};

export const createBooking = async (data: BookingRequest) => {
  const response = await api.post<BookingResult>("/api/book/", data);
  return response.data;
};

export const setupPayoutAccount = async (upiId: string) => {
    const response = await api.post<PayoutAccount>("/api/financials/account", {
        account_type: "upi",
        details: { upi_id: upiId }
    });
    return response.data;
}

export const getPayoutAccount = async () => {
    try {
        const response = await api.get<PayoutAccount>("/api/financials/account");
        return response.data;
    } catch (e) {
        return null; // No account exists
    }
}

export default api;

