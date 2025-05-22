
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppSidebar from "@/components/navigation/Sidebar";
import AppHeader from "@/components/navigation/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdminDashboardPage = pathname === "/admin/dashboard";

  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={!isAdminDashboardPage}> {/* Default open unless it's the admin dashboard */}
        <div className="flex min-h-screen w-full bg-muted/40">
          {!isAdminDashboardPage && <AppSidebar />}
          <div className="flex flex-1 flex-col">
            {isAdminDashboardPage ? (
              // Admin dashboard renders directly, taking full width
              <main className="flex-1">{children}</main>
            ) : (
              // Other pages get the standard header and sidebar inset
              <>
                <AppHeader />
                <SidebarInset>
                  <main className="flex-1 p-4 sm:p-6">{children}</main>
                </SidebarInset>
              </>
            )}
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
