import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
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
    rate_type: "HOURLY"
  });
  return response.data;
};

export const setSpotAvailability = async (spotId: string, start: Date, end: Date) => {
  const response = await api.post("/my-spot/availability", {
    spot_id: spotId,
    start_time: start.toISOString(),
    end_time: end.toISOString()
  });
  return response.data;
};

export const searchParking = async (params: SearchParams) => {
  const response = await api.get<SearchResult[]>("/api/search/availability", {
    params: params
  });
  return response.data;
};

export const createBooking = async (data: BookingRequest) => {
  const response = await api.post<BookingResult>("/api/book/", data);
  return response.data;
};

export default api;
