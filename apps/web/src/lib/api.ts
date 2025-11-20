// apps/web/src/lib/api.ts
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

  // New Profile Fields
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

// --- Other Calls (Lots, Bookings, etc.) ---

export const createLot = async (data: any) => {
  const response = await api.post("/lots/", data);
  return response.data;
};

export const getMyLots = async () => {
  const response = await api.get("/lots/my-lots");
  return response.data;
};

export const getLotDetails = async (lotId: string) => {
  const response = await api.get(`/lots/${lotId}`);
  return response.data;
};

export const createBooking = async (data: any) => {
  const response = await api.post("/api/book/", data);
  return response.data;
};

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

export default api;
