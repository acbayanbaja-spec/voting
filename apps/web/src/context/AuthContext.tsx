"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, fetchApi } from "../lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isStudent: boolean;
  isComelec: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const storedToken = localStorage.getItem("seait_token");
        if (storedToken) {
          setToken(storedToken);
          const res = await fetchApi("/auth/me");
          if (res.success && res.data) {
            setUser(res.data);
          }
        }
      } catch (err) {
        console.error("Session restore failed:", err);
        localStorage.removeItem("seait_token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("seait_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("seait_token");
    setToken(null);
    setUser(null);
    window.location.href = "/";
  };

  const isStudent = user?.role === "STUDENT";
  const isComelec = user?.role === "COMELEC_OFFICER";
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isStudent,
        isComelec,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
