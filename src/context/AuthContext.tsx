
"use client";

import type { AuthenticatedUser, Role } from "@/lib/types";
import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (userData: AuthenticatedUser) => void;
  logout: () => void;
  updateLoggedInUser: (updatedUserData: Partial<AuthenticatedUser>) => void; // Renamed from updateUser
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("emsUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Ensure otp_created_at is a Date object if it exists
        if (parsedUser.otp_created_at) {
          parsedUser.otp_created_at = new Date(parsedUser.otp_created_at);
        }
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("emsUser");
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData: AuthenticatedUser) => {
    // Ensure otp_created_at is a Date object if it exists before storing
    const userToStore = { ...userData };
    if (userToStore.otp_created_at && !(userToStore.otp_created_at instanceof Date)) {
        userToStore.otp_created_at = new Date(userToStore.otp_created_at);
    }
    setUser(userToStore);
    localStorage.setItem("emsUser", JSON.stringify(userToStore));
    if (userData.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/employee/dashboard");
    }
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("emsUser");
    router.push("/");
  }, [router]);

  const updateLoggedInUser = useCallback((updatedUserData: Partial<AuthenticatedUser>) => { // Renamed from updateUser
    setUser(prevUser => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updatedUserData };
      // Ensure otp_created_at is a Date object if it exists before storing
      if (newUser.otp_created_at && !(newUser.otp_created_at instanceof Date)) {
        newUser.otp_created_at = new Date(newUser.otp_created_at);
      }
      localStorage.setItem("emsUser", JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateLoggedInUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
