
"use client";

import type { z } from "zod";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { loginUser, generateAndStoreOTP, verifyOtp, fetchUserDetails, type LoginResponse, type UserDetailsResponse } from "@/lib/actions/auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Define Zod schemas
import * as zGlobal from 'zod'; // Use a global import for Zod

const UserIdSchema = zGlobal.object({
  userId: zGlobal.string().min(1, "User ID is required"),
});

const PasswordSchema = zGlobal.object({
  password: zGlobal.string().min(1, "Password is required"),
});

const OtpSchema = zGlobal.object({
  otp: zGlobal.string().length(6, "OTP must be 6 digits"),
});

type UserIdFormValues = z.infer<typeof UserIdSchema>;
type PasswordFormValues = z.infer<typeof PasswordSchema>;
type OtpFormValues = z.infer<typeof OtpSchema>;

export default function LoginPage() {
  const [phase, setPhase] = useState<"userId" | "password" | "otp">("userId");
  const [userDetails, setUserDetails] = useState<{ name: string; role: "admin" | "employee", id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authIsLoading && user) {
      if (user.role === 'admin') router.push('/admin/dashboard');
      else router.push('/employee/dashboard');
    }
  }, [user, authIsLoading, router]);


  const userIdForm = useForm<UserIdFormValues>({
    resolver: zodResolver(UserIdSchema),
    defaultValues: { userId: "" },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { password: "" },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(OtpSchema),
    defaultValues: { otp: "" },
  });

  const handleUserIdSubmit = async (data: UserIdFormValues) => {
    setIsLoading(true);
    try {
      const response: UserDetailsResponse = await fetchUserDetails(data.userId);

      if (response.success && response.user) {
        setUserDetails(response.user);
        if (response.user.role === "admin") {
          setPhase("password");
        } else {
          const otpResponse = await generateAndStoreOTP(response.user.id);
          if(otpResponse.success) {
            toast({ title: "OTP Sent", description: otpResponse.message || "An OTP has been generated. Please get it from the admin." });
            setPhase("otp");
          } else {
            toast({ title: "Error", description: otpResponse.error || "Failed to send OTP.", variant: "destructive" });
          }
        }
      } else {
        toast({ title: "Error", description: response.error || "Invalid User ID", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handlePasswordSubmit = async (data: PasswordFormValues) => {
    if (!userDetails) return;
    setIsLoading(true);
    try {
      const response: LoginResponse = await loginUser(userDetails.id, data.password);

      if (response.success && response.user) {
        login(response.user);
      } else {
        toast({ title: "Login Failed", description: response.error || "Invalid credentials", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleOtpSubmit = async (data: OtpFormValues) => {
    if (!userDetails) return;
    setIsLoading(true);
    try {
      const response: LoginResponse = await verifyOtp(userDetails.id, data.otp);

      if (response.success && response.user) {
        login(response.user);
      } else {
        toast({ title: "Login Failed", description: response.error || "Invalid OTP", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
    setIsLoading(false);
  };
  
  if (authIsLoading || (!authIsLoading && user)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="items-center text-center">
          <Image src="/assets/JM-logo.png" alt="JM PlastoPack Logo" width={150} height={60} className="mb-4" />
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            {phase === "userId" && "Enter your User ID to continue."}
            {phase === "password" && `Hello ${userDetails?.name}. Enter your password.`}
            {phase === "otp" && `Hello ${userDetails?.name}. Enter the OTP provided by the admin.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {phase === "userId" && (
            <Form {...userIdForm}>
              <form onSubmit={userIdForm.handleSubmit(handleUserIdSubmit)} className="space-y-6">
                <FormField
                  control={userIdForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your User ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continue"}
                </Button>
              </form>
            </Form>
          )}

          {phase === "password" && userDetails?.role === "admin" && (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" {...field} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Login"}
                </Button>
                <Button variant="link" size="sm" className="w-full" onClick={() => { setPhase("userId"); setUserDetails(null); passwordForm.reset(); }}>
                  Use a different User ID
                </Button>
              </form>
            </Form>
          )}

          {phase === "otp" && userDetails?.role === "employee" && (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-6">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>One-Time Password</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Enter 6-digit OTP" {...field} maxLength={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify OTP"}
                </Button>
                <Button variant="link" size="sm" className="w-full" onClick={() => { setPhase("userId"); setUserDetails(null); otpForm.reset();}}>
                  Use a different User ID
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} J M PlastoPack Pvt. Ltd. All rights reserved.
      </p>
    </div>
  );
}

    