"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, UserCircle } from "lucide-react";
import { updateAdminDetailsAction } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";

const adminSettingsSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  currentPassword: z.string().optional(), // Optional: only if changing password
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(data => {
  if (data.newPassword || data.confirmPassword) { // If attempting to change password
    return data.currentPassword && data.currentPassword.length > 0; // Current password is required
  }
  return true;
}, {
  message: "Current password is required to change your password.",
  path: ["currentPassword"],
}).refine(data => {
  if (data.newPassword) { // If new password is provided
    return data.newPassword.length >= 6; // Must be at least 6 chars
  }
  return true;
}, {
  message: "New password must be at least 6 characters.",
  path: ["newPassword"],
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ["confirmPassword"],
});

type AdminSettingsFormValues = z.infer<typeof adminSettingsSchema>;

export default function AdminSettingsPage() {
  const { user, updateUser: updateAuthContextUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminSettingsFormValues>({
    resolver: zodResolver(adminSettingsSchema),
    defaultValues: {
      name: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/employee/dashboard'); // Redirect if not admin
      toast({ title: "Access Denied", description: "You do not have permission to access this page.", variant: "destructive" });
    } else if (user) {
      form.reset({ name: user.name });
    }
  }, [user, router, toast, form]);

  const onSubmit = async (values: AdminSettingsFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    // In a real app, currentPassword would be verified on the server before updating
    // For this mock, we'll assume it's correct if provided for a password change attempt.
    if(values.newPassword && !values.currentPassword) {
        form.setError("currentPassword", { type: "manual", message: "Current password is required to set a new one." });
        setIsSubmitting(false);
        return;
    }

    const response = await updateAdminDetailsAction(user.id, values.name, values.newPassword);
    if (response.success) {
      toast({ title: "Success", description: "Your details have been updated." });
      if (values.name !== user.name) {
        updateAuthContextUser({ name: values.name });
      }
      form.reset({ 
        name: values.name, 
        currentPassword: "", 
        newPassword: "", 
        confirmPassword: "" 
      });
    } else {
      toast({ title: "Error", description: response.error || "Failed to update details.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };
  
  if (!user || user.role !== 'admin') {
     return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Redirecting...</p></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <UserCircle className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl">Admin Account Settings</CardTitle>
              <CardDescription>Manage your personal admin profile and security.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Change Password (Optional)</h3>
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your current password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="ml-auto">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
