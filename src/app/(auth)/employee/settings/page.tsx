"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { UserCircle, Shield, Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  if (!user) {
    // This case should ideally be handled by ProtectedRoute or AuthContext loading state
    return <div className="flex justify-center items-center h-full"><p>Loading user data...</p></div>;
  }
  
  if (user.role !== 'employee') {
    // This check is a fallback, ProtectedRoute should handle role mismatch
    router.replace('/admin/dashboard'); // Or a generic access denied page
    toast({ title: "Access Denied", description: "This page is for employees only.", variant: "destructive" });
    return null; 
  }


  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="max-w-lg mx-auto shadow-lg">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center space-x-4">
            <UserCircle className="h-12 w-12 text-primary" />
            <div>
              <CardTitle className="text-2xl font-semibold">My Account Details</CardTitle>
              <CardDescription>Your personal information within the system.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center space-x-3 p-3 border rounded-md">
            <UserCircle className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 border rounded-md">
            <Shield className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 border rounded-md">
            <Fingerprint className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-medium"><code className="text-sm bg-gray-100 p-1 rounded">{user.id}</code></p>
            </div>
          </div>
          
          <div className="pt-4 text-sm text-muted-foreground">
            <p>For any changes to your account details, please contact an administrator.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
