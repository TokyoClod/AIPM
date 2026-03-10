import { create } from 'zustand';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: any, token: string) => void;
  logout: () => void;
}

const getInitialAuth = () => {
  try {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        token: parsed.state?.token || token,
        user: parsed.state?.user || null,
        isAuthenticated: !!token
      };
    }
    return { token: token, user: null, isAuthenticated: !!token };
  } catch (e) {
    const token = localStorage.getItem('token');
    return { token: token, user: null, isAuthenticated: !!token };
  }
};

const initialAuth = getInitialAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  isAuthenticated: initialAuth.isAuthenticated,
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth-storage');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
