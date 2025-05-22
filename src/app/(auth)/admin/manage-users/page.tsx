
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MoreHorizontal, UserPlus, Trash2, KeyRound, Loader2, Users, Briefcase } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { AuthenticatedUser, Role } from "@/lib/types";
import { getAllUsers, addUser, deleteUser, generateAndStoreOTP } from "@/lib/actions/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const userManagementSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["admin", "employee"]),
  password: z.string().optional(), 
  confirmPassword: z.string().optional(),
}).refine(data => data.role === "employee" || (data.role === "admin" && data.password && data.password.length >= 4), { 
  message: "Password must be at least 4 characters for admin users",
  path: ["password"],
}).refine(data => data.role === "employee" || (data.role === "admin" && data.password === data.confirmPassword), {
  message: "Passwords do not match for admin users",
  path: ["confirmPassword"],
});

type UserManagementFormValues = z.infer<typeof userManagementSchema>;

export default function ManageUsersPage() {
  const { user: loggedInUser } = useAuth(); 
  const router = useRouter();
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AuthenticatedUser[]>([]);
  const [employeeUsers, setEmployeeUsers] = useState<AuthenticatedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthenticatedUser | null>(null); 

  const userForm = useForm<UserManagementFormValues>({
    resolver: zodResolver(userManagementSchema),
    defaultValues: { name: "", userId: "", role: "employee", password: "", confirmPassword: "" },
  });

  useEffect(() => {
     if (loggedInUser && loggedInUser.role !== 'admin') {
      router.replace('/employee/dashboard');
      toast({ title: "Access Denied", description: "You do not have permission to access this page.", variant: "destructive" });
    } else if (loggedInUser) {
      fetchUsersList();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser, router, toast]);

  async function fetchUsersList() {
    setIsLoading(true);
    try {
      const fetchedUsers = await getAllUsers();
      setAdminUsers(fetchedUsers.filter(u => u.role === 'admin'));
      setEmployeeUsers(fetchedUsers.filter(u => u.role === 'employee'));
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch users.", variant: "destructive" });
    }
    setIsLoading(false);
  }

  const handleFormSubmit = async (values: UserManagementFormValues) => {
    setIsSubmitting(true);
    if (editingUser) {
        // Placeholder for edit functionality if needed in future
        toast({ title: "Info", description: "Edit functionality placeholder."});
        setEditingUser(null);
    } else {
        const passwordForAction = values.role === 'admin' ? values.password! : 'employee_otp_login';
        const response = await addUser(values.userId, values.name, passwordForAction, values.role);
        
        if (response.success) {
          toast({ title: "Success", description: response.message });
          fetchUsersList();
          userForm.reset();
           const closeButton = document.getElementById('addUserDialogCloseButton');
           if (closeButton) closeButton.click();
        } else {
          toast({ title: "Error", description: response.error, variant: "destructive" });
        }
    }
    setIsSubmitting(false);
  };

  const handleDeleteUser = async (userIdToDelete: string, userName: string) => {
    if (!loggedInUser) return;
    if (userIdToDelete === loggedInUser.id) {
      toast({ title: "Action Denied", description: "You cannot delete your own account.", variant: "destructive" });
      return;
    }
    if (userIdToDelete === "admin" || userIdToDelete === "employee") {
      toast({ title: "Action Denied", description: `Cannot delete default '${userIdToDelete}' account.`, variant: "destructive" });
      return;
    }

    const confirmation = window.confirm(`Are you sure you want to delete user "${userName}" (ID: ${userIdToDelete})? This action cannot be undone.`);
    if (!confirmation) return;

    setIsSubmitting(true);
    const response = await deleteUser(userIdToDelete);
    if (response.success) {
      toast({ title: "Success", description: response.message });
      fetchUsersList();
    } else {
      toast({ title: "Error", description: response.error, variant: "destructive" });
    }
    setIsSubmitting(false);
  };
  
  const handleResetOtp = async (userIdToReset: string, userName: string) => {
    setIsSubmitting(true);
    const response = await generateAndStoreOTP(userIdToReset);
     if (response.success && response.otp) {
      toast({ title: "Success", description: `New OTP generated for ${userName}. OTP: ${response.otp}. It's also available on the main Admin Dashboard.` });
      // No need to fetchUsersList here as admin dashboard is the source of truth for current OTPs for employees
    } else {
      toast({ title: "Error", description: response.error || "Failed to generate OTP.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const openAddUserDialog = () => {
    setEditingUser(null);
    userForm.reset({ name: "", userId: "", role: "employee", password: "" });
  };
  
  const renderUserTable = (userList: AuthenticatedUser[], userType: 'admin' | 'employee') => {
    if (isLoading) {
      return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }
    if (userList.length === 0) {
      return <p className="text-center text-muted-foreground py-4 px-4">No {userType}s found.</p>;
    }
    return (
        <div className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="min-w-[200px]">User ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userList.map((u) => (
              <TableRow key={u.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="capitalize">
                    <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>{u.role}</Badge>
                </TableCell>
                <TableCell><code className="text-xs bg-muted p-1 rounded-md">{u.id}</code></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isSubmitting}><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {userType === 'employee' && u.role === 'employee' && (
                        <DropdownMenuItem onClick={() => handleResetOtp(u.id, u.name)} disabled={isSubmitting}>
                            <KeyRound className="mr-2 h-4 w-4" /> Reset OTP
                        </DropdownMenuItem>
                      )}
                      {(u.id !== loggedInUser?.id && u.id !== 'admin' && u.id !== 'employee') && (
                        <DropdownMenuItem 
                            className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive" 
                            onClick={() => handleDeleteUser(u.id, u.name)} 
                            disabled={isSubmitting}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      )}
                      {(u.id === loggedInUser?.id || u.id === 'admin' || u.id === 'employee') && (
                        <DropdownMenuItem disabled>
                            {u.id === loggedInUser?.id ? 'Cannot delete self' : `Cannot delete default '${u.id}'`}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
    );
  };

  if (!loggedInUser || loggedInUser.role !== 'admin') {
     return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2 text-muted-foreground">Redirecting...</p></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">User Management</CardTitle>
            <CardDescription>Add, remove, or manage system users and their access.</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={openAddUserDialog} id="addUserTriggerButton"><UserPlus className="mr-2 h-4 w-4" /> Add New User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
              </DialogHeader>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(handleFormSubmit)} className="space-y-4">
                  <FormField control={userForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="User's full name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={userForm.control} name="userId" render={({ field }) => (
                      <FormItem><FormLabel>User ID</FormLabel><FormControl><Input placeholder="Unique user ID (e.g., john.doe)" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={userForm.control} name="role" render={({ field }) => (
                      <FormItem><FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!editingUser}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="employee">Employee</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                  )} />
                  {(userForm.watch("role") === "admin" || (editingUser && editingUser.role === "admin")) && (
                    <>
                      <FormField control={userForm.control} name="password" render={({ field }) => (
                          <FormItem><FormLabel>{editingUser ? "New Password (optional)" : "Password (for Admin)"}</FormLabel><FormControl><Input type="password" placeholder={editingUser ? "Leave blank to keep current" : "Enter password for admin"} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={userForm.control} name="confirmPassword" render={({ field }) => (
                          <FormItem><FormLabel>{editingUser ? "Confirm New Password" : "Confirm Password (for Admin)"}</FormLabel><FormControl><Input type="password" placeholder={editingUser ? "Confirm new password" : "Confirm admin password"} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </>
                  )}
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline" type="button" id="addUserDialogCloseButton">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (editingUser ? "Save Changes" : "Add User")}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="admin-accounts">
                <AccordionTrigger className="hover:bg-muted/50 px-4 py-3 rounded-md text-lg font-semibold">
                  <div className="flex items-center">
                    <Users className="mr-3 h-6 w-6 text-primary" />
                    Administrator Accounts ({adminUsers.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t bg-background data-[state=open]:p-0 data-[state=closed]:p-0">
                  {renderUserTable(adminUsers, 'admin')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="employee-accounts">
                <AccordionTrigger className="hover:bg-muted/50 px-4 py-3 rounded-md text-lg font-semibold">
                  <div className="flex items-center">
                    <Briefcase className="mr-3 h-6 w-6 text-primary" />
                    Employee Accounts ({employeeUsers.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t bg-background data-[state=open]:p-0 data-[state=closed]:p-0">
                  {renderUserTable(employeeUsers, 'employee')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
         <CardFooter className="text-sm text-muted-foreground">
           Total Users: {adminUsers.length + employeeUsers.length}
        </CardFooter>
      </Card>
    </div>
  );
}
    

    
