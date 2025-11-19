import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  _hasHydrated: boolean; // ADDED: Track persistence status
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void; // ADDED: Setter for hydration status
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      _hasHydrated: false, // Initial state is false
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }), // Setter definition
    }),
    {
      name: "parkease-auth-storage", // unique name for localStorage key
      // CRITICAL FIX: Rehydration Hook to set the flag after state loads from local storage
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);
