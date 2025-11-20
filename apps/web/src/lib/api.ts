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
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// --- Interfaces ---

export interface UserRead {
  id: string;
  name: string;
  phone: string;
  role: string;
  email?: string;
  profile_picture_url?: string;
  default_vehicle_plate?: string;
  bio?: string;
  work?: string;
  location?: string;
  school?: string;
  languages?: string;
  interests?: string[];
}

export interface Token {
  access_token: string;
  token_type: string;
  user: UserRead;
}

export interface PayoutAccount {
  id: string;
  account_type: string;
  details: {
    upi_id?: string;
    [key: string]: any;
  };
  is_active: boolean;
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

export interface BookingItem {
  id: string;
  lot_name: string;
  address: string;
  start_time: string;
  end_time: string;
  status: string;
  qr_code_data?: string;
  amount?: number;
}

export interface ScanResult {
  success: boolean;
  message: string;
  driver_name?: string;
  vehicle_plate?: string;
}

export interface PricingRule {
  id: string;
  lot_id: string;
  name: string;
  rate: number;
  rate_type: string;
  is_active: boolean;
  priority: number;
}

export interface Preferences {
  currency: string;
  language: string;
  timezone: string;
}

export interface Notifications {
  email_messages: boolean;
  sms_messages: boolean;
  push_reminders: boolean;
  email_promotions: boolean;
}

// --- NEW: Seller/Lot Interfaces ---
export interface Spot {
  id: string;
  name: string;
  spot_type: string;
}

export interface LotDetails {
  id: string;
  name: string;
  address: string;
  owner_user_id: string;
  spots: Spot[];
}

// --- Auth Calls ---

export const loginWithPassword = async (data: {
  email: string;
  password: string;
}) => {
  const response = await api.post<Token>("/auth/login-with-password", data);
  return response.data;
};

export const requestLoginOtp = async (data: { phone: string }) => {
  const response = await api.post("/auth/login-request-otp", data);
  return response.data;
};

export const signup = async (data: any) => {
  const response = await api.post<Token>("/auth/signup", data);
  return response.data;
};

export const updateUserProfile = async (data: any) => {
  const response = await api.patch<UserRead>("/auth/profile", data);
  return response.data;
};

// --- Settings Calls ---

export const getPreferences = async () => {
  const response = await api.get<Preferences>("/auth/settings/preferences");
  return response.data;
};

export const updatePreferences = async (data: {
  currency: string;
  language: string;
}) => {
  const response = await api.put<Preferences>(
    "/auth/settings/preferences",
    data
  );
  return response.data;
};

export const getNotifications = async () => {
  const response = await api.get<Notifications>("/auth/settings/notifications");
  return response.data;
};

export const updateNotifications = async (data: Notifications) => {
  const response = await api.put<Notifications>(
    "/auth/settings/notifications",
    data
  );
  return response.data;
};

// --- Inventory (Lots) ---

export const createLot = async (data: any) => {
  const response = await api.post("/lots/", data);
  return response.data;
};

export const getMyLots = async () => {
  const response = await api.get("/lots/my-lots");
  return response.data;
};

export const getLotDetails = async (lotId: string) => {
  const response = await api.get<LotDetails>(`/lots/${lotId}`);
  return response.data;
};

// --- Seller Management (Availability & Pricing) ---
// NEW: These were missing and causing your build error

export const setSpotAvailability = async (data: {
  spot_id: string;
  start_time: string;
  end_time: string;
}) => {
  const response = await api.post("/my-spot/availability", data);
  return response.data;
};

export const setSpotPricing = async (data: {
  lot_id: string;
  rate: number;
  rate_type: string;
}) => {
  const response = await api.post("/my-spot/pricing", data);
  return response.data;
};

// --- Search & Booking ---

export const searchParking = async (params: any) => {
  const response = await api.get<SearchResult[]>("/api/search/availability", {
    params,
  });
  return response.data;
};

export const createBooking = async (data: any) => {
  const response = await api.post("/api/book/", data);
  return response.data;
};

export const getMyBookings = async () => {
  const response = await api.get<BookingItem[]>("/api/my-bookings");
  return response.data;
};

// --- Redemption (Scan) ---

export const scanQRCode = async (qrCode: string) => {
  const response = await api.post<ScanResult>("/api/scan", { qr_code: qrCode });
  return response.data;
};

// --- Financials ---

export const setupPayoutAccount = async (upiId: string) => {
  const response = await api.post<PayoutAccount>("/api/financials/account", {
    account_type: "upi",
    details: { upi_id: upiId },
  });
  return response.data;
};

export const getPayoutAccount = async () => {
  try {
    const response = await api.get<PayoutAccount>("/api/financials/account");
    return response.data;
  } catch (e) {
    return null;
  }
};

// --- B2B Pricing Calls ---

export const getPricingRules = async (lotId: string) => {
  const response = await api.get<PricingRule[]>(`/api/b2b/lots/${lotId}/rules`);
  return response.data;
};

export const createPricingRule = async (lotId: string, data: any) => {
  const payload = { ...data, rate_type: "HOURLY" };
  const response = await api.post<PricingRule>(
    `/api/b2b/lots/${lotId}/rules`,
    payload
  );
  return response.data;
};

export const deletePricingRule = async (ruleId: string) => {
  const response = await api.delete(`/api/b2b/rules/${ruleId}`);
  return response.data;
};

export default api;
