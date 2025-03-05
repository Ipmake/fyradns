import { create } from 'zustand';

interface AuthState {
    user: Types.AuthedUser | null;
    setUser: (user: Types.AuthedUser) => void;

    logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null })
    },
}));

export default useAuthStore;