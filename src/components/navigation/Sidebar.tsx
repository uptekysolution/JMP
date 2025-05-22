
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Users, Settings, Calculator, Edit3, History, FileText, LogOut, UserCog, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";


const AdminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Home },
  { href: "/admin/manage-users", label: "Manage Users", icon: Users },
  { href: "/bopp-calculator", label: "BOPP Calculator", icon: Calculator },
  { href: "/update-material-rates", label: "Update Rates", icon: Edit3 },
  { href: "/rate-history", label: "Rate History", icon: History },
  // { href: "/rate-card", label: "Rate Card", icon: FileText }, // Rate card is usually generated, not a primary nav item
  { href: "/admin/settings", label: "System Settings", icon: Settings },
];

const EmployeeNavItems = [
  { href: "/employee/dashboard", label: "Dashboard", icon: Home },
  { href: "/bopp-calculator", label: "BOPP Calculator", icon: Calculator },
  { href: "/employee/settings", label: "My Settings", icon: UserCog },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = user?.role === "admin" ? AdminNavItems : EmployeeNavItems;

  return (
    // SidebarProvider removed from here
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4 items-center justify-center flex flex-col">
         <Link href={user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <Image src="/assets/JM-logo.png" alt="JM PlastoPack Logo" width={120} height={40} />
        </Link>
         <Link href={user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} className="items-center gap-2 hidden group-data-[collapsible=icon]:flex">
           <ShoppingBag className="h-8 w-8 text-primary" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                  className="w-full justify-start"
                  tooltip={item.label}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <Button variant="ghost" onClick={logout} className="w-full justify-start group-data-[collapsible=icon]:justify-center">
          <LogOut className="h-5 w-5 mr-2 group-data-[collapsible=icon]:mr-0" />
          <span className="group-data-[collapsible=icon]:hidden">Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
    // SidebarProvider removed from here
  );
}

    