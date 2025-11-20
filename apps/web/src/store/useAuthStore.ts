import { create } from "zustand";
import { persist } from "zustand/middleware";

// UPDATED: Added Airbnb-style profile fields
interface User {
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
  languages?: string;
  school?: string;
  interests?: string[]; // Array of tags
}

interface AuthState {
  token: string | null;
  user: User | null;
  _hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (updates: Partial<User>) => void; // New helper
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      _hasHydrated: false,
      setAuth: (token, user) => set({ token, user }),
      // New: Updates the user object without needing a full re-login
      updateUser: (updates) => set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
      })),
      logout: () => set({ token: null, user: null }),
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: "parkease-auth-storage",
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);
