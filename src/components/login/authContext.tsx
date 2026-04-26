import { createContext, useContext, useState, type ReactNode } from "react";
import type { UserRole } from "@/types/tabledata";
import { signOutMainAdminFromAppwrite } from "@/service/appwriteAuth";

export type AuthUser = {
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
};

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("auth-user") ?? localStorage.getItem("admin");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData: AuthUser) => {
    localStorage.setItem("auth-user", JSON.stringify(userData));
    localStorage.setItem("admin", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    void signOutMainAdminFromAppwrite();
    localStorage.removeItem("auth-user");
    localStorage.removeItem("admin");
    setUser(null);
  };

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
