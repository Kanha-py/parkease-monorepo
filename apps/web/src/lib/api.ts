import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// --- Interfaces ---
export interface Lot {
  id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface CreateLotData {
  name: string;
  address: string;
  spot_type: "CAR" | "TWO_WHEELER";
  amenities: string[];
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

export interface Spot {
  id: string;
  name: string;
  spot_type: string;
}

export interface LotDetails extends Lot {
  spots: Spot[];
}

// --- New API Calls ---
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
