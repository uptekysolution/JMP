"use client";

import type { ReactNode } from "react";
import type { Role } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/"); // Redirect to login if not authenticated
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // If roles are specified and user's role is not allowed, redirect
      // For example, if an employee tries to access an admin page
      if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (user.role === "employee") {
        router.replace("/employee/dashboard");
      } else {
        router.replace("/"); // Fallback, should not happen with defined roles
      }
      return;
    }

    // Role-based redirection if on a generic auth path but should be on specific dashboard
    if (pathname === "/auth-check" || pathname.startsWith("/(auth)")) { // A generic path or root of auth
      if (user.role === "admin" && !pathname.startsWith("/admin")) {
         // router.replace("/admin/dashboard"); // Avoid infinite redirect loops
      } else if (user.role === "employee" && !pathname.startsWith("/employee")) {
        // router.replace("/employee/dashboard"); // Avoid infinite redirect loops
      }
    }

  }, [user, isLoading, router, allowedRoles, pathname]);

  if (isLoading || (!user && pathname !== "/")) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user is loaded and authenticated, and role check (if any) passed or not needed for this route specifically.
  return <>{children}</>;
}
