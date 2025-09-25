import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/services/api"; // Axios instance pointing to VITE_API_URL

// Define allowed user roles
export type UserRole = "admin" | "player" | "user"| "super-admin";

// Define User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  verified?: boolean;
  profileImage?: string;
  teamId?: string;
  matchId?: string;
  playerCode?: string; // Optional player code field
}

// Define the context shape
interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
  logout: () => void;
  register: (formData: FormData) => Promise<boolean>;
  loading: boolean;

  // ✅ Added functions
  forgotPassword: (email: string) => Promise<boolean>;
  googleLogin: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("pplt20_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Login
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; role?: string }> => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      localStorage.setItem("pplt20_user", JSON.stringify(user));
      localStorage.setItem("pplt20_token", token);
      setUser(user);

      return { success: true, role: user.role };
    } catch (error: any) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        // invalid credentials
        return { success: false };
      }
      console.error("Login failed:", error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem("pplt20_user");
    localStorage.removeItem("pplt20_token");
     window.location.href = "/login"; 
  };

  // Register
  const register = async (formData: FormData): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await api.post("/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const { token, user } = response.data;
      localStorage.setItem("pplt20_user", JSON.stringify(user));
      localStorage.setItem("pplt20_token", token);
      setUser(user);
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Forgot Password
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      await api.post("/auth/forgot-password", { email });
      return true;
    } catch (error) {
      console.error("Forgot password failed:", error);
      return false;
    }
  };

  // ✅ Google Login (redirects to backend OAuth route)
  const googleLogin = async (): Promise<void> => {
    try {
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, logout, register, loading, forgotPassword, googleLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
};
