
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import {
    deleteUser,
    getAllUsers,
    addUser,
    generateAndStoreOTP,
    revokeOTP,
    updateAdminDetails
} from "@/lib/actions/auth";
import {
  Plus,
  Trash2,
  Settings,
  ChevronRight,
  User,
  Briefcase,
  Loader2,
  AlertTriangle,
  KeyRound,
  ShieldOff,
  Copy,
  LogOut,
  Bell,
  HelpCircle,
  Database,
  Shield,
  Home,
  Save,
  Menu,
  Calculator,
  Edit3,
  History,
  Users,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { AuthenticatedUser } from '@/lib/types';
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface DashboardUser extends AuthenticatedUser {
    otp_created_at: string | null;
}


interface OtpDisplayInfo {
  isOpen: boolean;
  userId: string | null;
  userName: string | null;
  otp: string | null;
}

interface DeleteConfirmationInfo {
  isOpen: boolean;
  userId: string | null;
  userName: string | null;
}

function AdminDashboardContent() {
  const router = useRouter();
  const { user: loggedInUser, logout, updateLoggedInUser } = useAuth();
  const { toast } = useToast();
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [confirmNewUserPassword, setConfirmNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<'admin' | 'employee'>("employee");
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [admins, setAdmins] = useState<DashboardUser[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [otpDisplayInfo, setOtpDisplayInfo] = useState<OtpDisplayInfo>({
    isOpen: false,
    userId: null,
    userName: null,
    otp: null,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationInfo>({
    isOpen: false,
    userId: null,
    userName: null,
  });
  const [isNavigatingToBopp, setIsNavigatingToBopp] = useState(false);

  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [settingsName, setSettingsName] = useState(loggedInUser?.name || '');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [settingsConfirmNewPassword, setSettingsConfirmNewPassword] = useState('');
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  useEffect(() => {
     if (loggedInUser) {
         setSettingsName(loggedInUser.name);
     }
  }, [loggedInUser]);

  useEffect(() => {
      if (!isSettingsDialogOpen) {
          setSettingsNewPassword('');
          setSettingsConfirmNewPassword('');
          setSettingsError(null);
          setSettingsName(loggedInUser?.name || '');
      }
  }, [isSettingsDialogOpen, loggedInUser]);


  const companyName = "J M PlastoPack Pvt. Ltd.";


  useEffect(() => {
    if (!openAddUserDialog) {
      setNewUserId("");
      setNewUserName("");
      setNewUserPassword("");
      setConfirmNewUserPassword("");
      setNewUserRole("employee");
      setErrorMessage(null);
    }
  }, [openAddUserDialog]);

  useEffect(() => {
    if (newUserRole === 'employee') {
        setNewUserPassword("");
        setConfirmNewUserPassword("");
    }
  }, [newUserRole]);


  useEffect(() => {
    fetchUsersList();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsersList = async () => {
    setLoadingUsers(true);
    setActionLoading(prev => ({...prev, fetch: true}));
    try {
      const allAuthUsers: AuthenticatedUser[] = await getAllUsers();
      const dashboardUsers = allAuthUsers.map(u => ({
        ...u,
        otp_created_at: u.otp_created_at ? u.otp_created_at.toISOString() : null
      })) as DashboardUser[];
      setUsers(dashboardUsers.filter((user) => user.role === "employee"));
      setAdmins(dashboardUsers.filter((user) => user.role === "admin"));
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users.",
      });
    } finally {
      setLoadingUsers(false);
      setActionLoading(prev => ({...prev, fetch: false}));
    }
  };

  const handleAddUserSubmit = async () => {
    setErrorMessage(null);

    if (!newUserId || !newUserName || !newUserRole) {
      setErrorMessage("User ID, Name, and Role are required.");
      return;
    }

    if (newUserRole === 'admin') {
        if (!newUserPassword) {
            setErrorMessage("Password is required for admin users.");
            return;
        }
        if (newUserPassword.length < 4) {
            setErrorMessage("Admin password must be at least 4 characters long.");
            return;
        }
        if (newUserPassword !== confirmNewUserPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }
    }

    setIsAddingUser(true);
    const passwordToSend = newUserRole === 'admin' ? newUserPassword : 'employee_otp_login';

    try {
      const result = await addUser(newUserId, newUserName, passwordToSend, newUserRole);
      if (result.success) {
        setOpenAddUserDialog(false);
        await fetchUsersList();
        toast({
          title: "Success",
          description: result.message || "User added successfully!",
        });
      } else {
        setErrorMessage(result.error || "Failed to add user. The User ID might already exist.");
        toast({
          variant: "destructive",
          title: "Error Adding User",
          description: result.error || "Failed to add user. The User ID might already exist.",
        });
      }
    } catch (error) {
      console.error("Failed to add user:", error);
      setErrorMessage("An unexpected error occurred while adding the user.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleDeleteUserClick = (id: string, name: string) => {
    if (loggedInUser && id === loggedInUser.id) {
        toast({
          variant: "destructive",
          title: "Action Denied",
          description: "You cannot delete your own account.",
        });
        return;
    }
    if (id === "admin" || id === "employee") {
      toast({
        variant: "destructive",
        title: "Action Denied",
        description: `The default '${id}' account cannot be deleted.`,
      });
      return;
    }
    setDeleteConfirmation({ isOpen: true, userId: id, userName: name });
  };

  const confirmDeleteUser = async () => {
    const id = deleteConfirmation.userId;
    const name = deleteConfirmation.userName;

    if (!id || !name) return;

     if (loggedInUser && id === loggedInUser.id) {
        toast({
            variant: "destructive",
            title: "Action Denied",
            description: "You cannot delete your own account.",
        });
        setDeleteConfirmation({ isOpen: false, userId: null, userName: null });
        return;
     }
     if (id === "admin" || id === "employee") {
        toast({
            variant: "destructive",
            title: "Action Denied",
            description: `The default '${id}' account cannot be deleted.`,
        });
        setDeleteConfirmation({ isOpen: false, userId: null, userName: null });
        return;
     }

    setActionLoading(prev => ({ ...prev, [`delete_${id}`]: true }));
    setDeleteConfirmation({ isOpen: false, userId: null, userName: null });

    try {
      const response = await deleteUser(id);
      if (response.success) {
         setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
         setAdmins(prevAdmins => prevAdmins.filter(admin => admin.id !== id));
        toast({
          title: "Success",
          description: `User "${name}" deleted successfully!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Deletion Failed",
          description: response?.error || `Could not delete user "${name}". They might be protected or an error occurred.`,
        });
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while deleting the user.",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: false }));
    }
  };

  const handleGenerateOTPClick = async (userId: string, userName: string) => {
    setActionLoading(prev => ({ ...prev, [`otp_${userId}`]: true }));
    try {
      const result = await generateAndStoreOTP(userId);
      if (result.success && result.otp) {
        await fetchUsersList();
        setOtpDisplayInfo({
          isOpen: true,
          userId: userId,
          userName: userName,
          otp: result.otp,
        });
        toast({
          title: "OTP Generated",
          description: `OTP generated successfully for ${userName}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "OTP Generation Failed",
          description: result.error || `Failed to generate OTP for ${userName}.`,
        });
      }
    } catch (error) {
      console.error("OTP Generation Error:", error);
      toast({
        variant: "destructive",
        title: "OTP Generation Error",
        description: `An unexpected error occurred while generating OTP for ${userName}.`,
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`otp_${userId}`]: false }));
    }
  };

  const copyToClipboard = (text: string | null) => {
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Copied!", description: "OTP copied to clipboard." });
      }, (err) => {
        toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy OTP." });
        console.error('Could not copy text: ', err);
      });
    }
  };

  const handleRevokeOTPClick = async (userId: string, userName: string) => {
    setActionLoading(prev => ({ ...prev, [`revoke_${userId}`]: true }));
    try {
      const result = await revokeOTP(userId);
      if (result.success) {
        await fetchUsersList();
        toast({
          title: "OTP Revoked",
          description: `OTP for ${userName} (ID: ${userId}) has been revoked.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "OTP Revocation Failed",
          description: result.error || `Failed to revoke OTP for ${userName}.`,
        });
      }
    } catch (error) {
      console.error("OTP Revocation Error:", error);
      toast({
        variant: "destructive",
        title: "OTP Revocation Error",
        description: `An unexpected error occurred while revoking OTP for ${userName}.`,
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`revoke_${userId}`]: false }));
    }
  };

  const handleBOPPAccess = () => {
    setIsNavigatingToBopp(true);
    router.push("/bopp-calculator");
  };

  const getOtpStatus = (otpTimestamp: string | null): { status: 'active' | 'expired' | 'none'; badgeVariant: 'default' | 'destructive' | 'secondary' } => {
    if (!otpTimestamp) {
      return { status: 'none', badgeVariant: 'secondary' };
    }
    try {
        const otpCreatedAt = new Date(otpTimestamp).getTime();
        if (isNaN(otpCreatedAt)) {
            console.warn(`Invalid OTP timestamp format: ${otpTimestamp}`);
            return { status: 'none', badgeVariant: 'secondary' };
        }
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (now - otpCreatedAt < fiveMinutes) {
        return { status: 'active', badgeVariant: 'default' };
        } else {
        return { status: 'expired', badgeVariant: 'destructive' };
        }
    } catch (e) {
        console.error("Error processing OTP timestamp:", e, "Timestamp:", otpTimestamp);
        return { status: 'none', badgeVariant: 'secondary' };
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

   const handleSaveSettings = async () => {
       setSettingsError(null);

       if (!settingsName.trim()) {
           setSettingsError("Name cannot be empty.");
           return;
       }

       if (settingsNewPassword && settingsNewPassword !== settingsConfirmNewPassword) {
           setSettingsError("Passwords do not match.");
           return;
       }
        if (settingsNewPassword && settingsNewPassword.length < 4) {
           setSettingsError("New password must be at least 4 characters long.");
           return;
       }

       setIsSavingSettings(true);

       try {
           if (!loggedInUser) throw new Error("Not logged in");

           const result = await updateAdminDetails(loggedInUser.id, settingsName, settingsNewPassword || undefined);

           if (result.success) {
                toast({
                  title: "Success",
                  description: "Your details have been updated.",
                });
                 const updatedUser: AuthenticatedUser = {
                     ...loggedInUser,
                     name: settingsName,
                 };
                 updateLoggedInUser(updatedUser);
               setIsSettingsDialogOpen(false);
           } else {
               setSettingsError(result.error || "Failed to update details.");
               toast({
                 variant: "destructive",
                 title: "Update Failed",
                 description: result.error || "An error occurred while updating details.",
               });
           }
       } catch (error: any) {
           console.error("Failed to save settings:", error);
           setSettingsError("An unexpected error occurred.");
            toast({
                 variant: "destructive",
                 title: "Error",
                 description: "An unexpected error occurred.",
            });
       } finally {
           setIsSavingSettings(false);
       }
   };


  const renderUserList = (userList: DashboardUser[], type: 'employee' | 'admin') => {
    if (loadingUsers || actionLoading['fetch']) {
      return (
        <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-medium">Loading data...</span>
        </div>
      );
    }
    if (userList.length === 0) {
      return (
        <div className="py-10 text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
            {type === 'employee' ? <Briefcase className="h-8 w-8 text-muted-foreground" /> : <User className="h-8 w-8 text-muted-foreground" />}
          </div>
          <p className="text-muted-foreground font-medium">No {type}s found</p>
          <p className="text-sm text-muted-foreground/80 mt-1">Add new {type}s using the "Add User" button</p>
        </div>
      );
    }

    const currentUserId = loggedInUser?.id;

    return (
      <ul className="divide-y divide-border">
        {userList.map((user) => {
          const otpInfo = type === 'employee' && user.otp_created_at ? getOtpStatus(user.otp_created_at) : null;
          const isActionInProgress = actionLoading[`delete_${user.id}`] || actionLoading[`otp_${user.id}`] || actionLoading[`revoke_${user.id}`];
          const isCurrentUser = user.id === currentUserId;
          const isProtectedDefault = user.id === 'admin' || user.id === 'employee';

          return (
            <li key={user.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 hover:bg-primary/5 transition-colors">
              <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                <Avatar className={`h-10 w-10 ${type === 'admin' ? 'bg-accent/10 border border-accent/30' : 'bg-primary/10 border border-primary/30'}`}>
                  <AvatarFallback className={`${type === 'admin' ? 'text-accent' : 'text-primary'} font-semibold`}>
                    {user.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-foreground font-medium">{user.name || 'N/A'}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                    <span>ID: {user.id}</span>
                    <span className="mx-1.5">•</span>
                    <span className="capitalize font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{user.role}</span>

                    {type === 'employee' && otpInfo && otpInfo.status !== 'none' && (
                      <>
                        <span className="mx-1.5">•</span>
                        <Badge variant={otpInfo.badgeVariant} className="text-xs capitalize py-0 px-1.5">
                          OTP: {otpInfo.status}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <TooltipProvider>
                  {type === 'employee' && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleGenerateOTPClick(user.id, user.name)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-9 w-9 rounded-md disabled:opacity-50"
                            disabled={isActionInProgress}
                          >
                            {actionLoading[`otp_${user.id}`] ?
                              <Loader2 size={18} className="animate-spin" /> :
                              <KeyRound size={18} />
                            }
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">Generate new OTP</p>
                        </TooltipContent>
                      </Tooltip>

                      {otpInfo?.status !== 'none' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRevokeOTPClick(user.id, user.name)}
                              className="text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 h-9 w-9 rounded-md disabled:opacity-50"
                              disabled={isActionInProgress}
                            >
                              {actionLoading[`revoke_${user.id}`] ?
                                <Loader2 size={18} className="animate-spin" /> :
                                <ShieldOff size={18} />
                              }
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p className="text-xs">Revoke OTP</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUserClick(user.id, user.name)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9 rounded-md disabled:opacity-50"
                        disabled={isActionInProgress || isCurrentUser || isProtectedDefault}
                      >
                        {actionLoading[`delete_${user.id}`] ?
                          <Loader2 size={18} className="animate-spin" /> :
                          <Trash2 size={18} />
                        }
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                       <p className="text-xs">
                        {isCurrentUser
                            ? 'Cannot delete self'
                            : isProtectedDefault
                            ? 'Cannot delete default system account'
                            : 'Delete user'}
                       </p>
                    </TooltipContent>
                  </Tooltip>

                   {isProtectedDefault && (
                     <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 border-amber-500/30">
                       Protected
                     </Badge>
                   )}
                   {isCurrentUser && !isProtectedDefault && (
                     <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                       You
                     </Badge>
                   )}
              </TooltipProvider>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <header className="bg-gradient-to-r from-primary via-indigo-700 to-blue-800 text-primary-foreground sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 sm:px-6 py-3 flex justify-between items-center border-b border-primary/30">
            <div className="flex items-center space-x-3">
              <Image src="/assets/JM-logo.png" alt={companyName} width={36} height={36} className="rounded-md border-2 border-white/50" />
              <h1 className="text-lg font-semibold tracking-tight">{companyName}</h1>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              <TooltipProvider>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-white hover:bg-white/10 h-9 w-9"><Bell size={18} /></Button></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Notifications</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-white hover:bg-white/10 h-9 w-9"><HelpCircle size={18} /></Button></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Help & Support</p></TooltipContent></Tooltip>
             </TooltipProvider>
              <div className="flex items-center space-x-2 ml-2">
                <Avatar className="h-8 w-8 border-2 border-primary/50">
                  <AvatarFallback className="bg-primary/80 text-white text-xs font-medium">
                    {loggedInUser?.name ? loggedInUser.name.charAt(0).toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm hidden sm:block">
                  <p className="font-medium">{loggedInUser?.name || 'Admin'}</p>
                </div>
              </div>
               <TooltipProvider>
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-white hover:bg-white/10 h-9 w-9" onClick={handleLogout}><LogOut size={18} /></Button></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Log Out</p></TooltipContent></Tooltip>
               </TooltipProvider>
            </div>

             <div className="md:hidden">
                <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-white hover:bg-white/10"><Menu size={24} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 bg-primary border-primary/50 text-primary-foreground shadow-xl">
                        <DropdownMenuItem className="flex items-center gap-3 p-3 focus:bg-white/10 focus:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                             <Avatar className="h-9 w-9 border-2 border-primary/50"><AvatarFallback className="bg-primary/80 text-white text-sm font-medium">{loggedInUser?.name ? loggedInUser.name.charAt(0).toUpperCase() : '?'}</AvatarFallback></Avatar>
                             <span className="font-medium">{loggedInUser?.name || 'Admin'}</span>
                        </DropdownMenuItem>
                        <Separator className="bg-white/20 my-1" />
                        <DropdownMenuItem className="flex items-center gap-2 p-2.5 focus:bg-white/10 focus:text-white" onClick={() => { setIsSettingsDialogOpen(true); setIsMobileMenuOpen(false); }}><Settings size={16} /> System Settings</DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 p-2.5 focus:bg-white/10 focus:text-white"><Bell size={16} /> Notifications</DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 p-2.5 focus:bg-white/10 focus:text-white"><HelpCircle size={16} /> Help & Support</DropdownMenuItem>
                        <Separator className="bg-white/20 my-1" />
                        <DropdownMenuItem className="flex items-center gap-2 p-2.5 text-red-300 focus:bg-red-500/20 focus:text-red-200" onClick={handleLogout}><LogOut size={16} /> Log Out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div>
              <h2 className="text-2xl font-bold">Administration Portal</h2>
              <p className="text-primary-foreground/70 mt-1 text-sm">Manage system users, access controls, and enterprise tools</p>
            </div>
            <div className="w-full sm:w-auto hidden md:block">
               <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                  <DialogTrigger asChild>
                     <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full sm:w-auto"><Settings size={16} className="mr-1.5" /> System Settings</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-card text-card-foreground">
                     <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <DialogTitle className="text-xl font-bold">System Settings</DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-1">Update your administrator account details.</DialogDescription>
                     </DialogHeader>
                     <div className="p-6 space-y-4">
                        <div className="space-y-1.5"><Label htmlFor="settingsName">Your Name</Label><Input id="settingsName" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} placeholder="Enter your display name"/></div>
                         <Separator className="my-4" />
                        <h4 className="text-md font-semibold">Change Password (Optional)</h4>
                        <div className="space-y-1.5"><Label htmlFor="settingsNewPassword">New Password</Label><Input type="password" id="settingsNewPassword" value={settingsNewPassword} onChange={(e) => setSettingsNewPassword(e.target.value)} placeholder="Enter new password"/></div>
                        <div className="space-y-1.5"><Label htmlFor="settingsConfirmNewPassword">Confirm New Password</Label><Input type="password" id="settingsConfirmNewPassword" value={settingsConfirmNewPassword} onChange={(e) => setSettingsConfirmNewPassword(e.target.value)} placeholder="Confirm new password" className={`${settingsNewPassword && settingsConfirmNewPassword && settingsNewPassword !== settingsConfirmNewPassword ? 'border-destructive ring-destructive' : ''}`}/></div>
                         {settingsError && (<div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive flex items-start"><AlertTriangle size={16} className="mt-0.5 flex-shrink-0" /><p className="ml-2">{settingsError}</p></div>)}
                     </div>
                      <DialogFooter className="px-6 pb-6 pt-4 border-t"><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={handleSaveSettings} disabled={isSavingSettings}>{isSavingSettings ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : (<><Save size={16} className="mr-1.5"/>Save Changes</>)}</Button></DialogFooter>
                  </DialogContent>
               </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <section id="dashboard-quick-stats" className="mb-8 scroll-mt-24 md:scroll-mt-32">
          <Card className="border-0 shadow-lg bg-card overflow-hidden rounded-xl">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="p-5 hover:bg-muted/50 transition-colors"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total Users</p>{loadingUsers ? <Loader2 className="h-6 w-6 animate-spin text-primary mt-1" /> : <h3 className="text-2xl font-bold text-foreground mt-1">{users.length + admins.length}</h3>}</div><div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center"><Users className="h-6 w-6 text-primary" /></div></div></div>
                <div className="p-5 hover:bg-muted/50 transition-colors"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Active OTPs</p>{loadingUsers ? <Loader2 className="h-6 w-6 animate-spin text-accent mt-1" /> : <h3 className="text-2xl font-bold text-foreground mt-1"> {users.filter(u => u.otp_created_at && getOtpStatus(u.otp_created_at).status === 'active').length}</h3>}</div><div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center"><KeyRound className="h-6 w-6 text-accent" /></div></div></div>
                <div className="p-5 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">System Integrity</p>
                      <h3 className="text-2xl font-bold text-foreground mt-1">Operational</h3>
                    </div>
                    <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                   <p className="text-xs text-muted-foreground mt-2">Last check: {new Date().toLocaleTimeString()}</p>
                </div>
                <div className="p-5 hover:bg-muted/50 transition-colors"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Last Synced</p><h3 className="text-2xl font-bold text-foreground mt-1">Just now</h3></div><div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center"><Database className="h-6 w-6 text-muted-foreground" /></div></div><p className="text-xs text-muted-foreground mt-2">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section id="user-management-section" className="lg:col-span-2 space-y-6 scroll-mt-24 md:scroll-mt-32">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div><h3 className="text-xl font-bold text-foreground">User Management</h3><p className="text-sm text-muted-foreground mt-1">Manage enterprise users and authentication</p></div>
              <Dialog open={openAddUserDialog} onOpenChange={setOpenAddUserDialog}>
                <DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus size={16} className="mr-1.5" />Add User</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md bg-card text-card-foreground">
                  <DialogHeader className="px-6 pt-6 pb-4 border-b"><DialogTitle className="text-xl font-bold">Create New User</DialogTitle><DialogDescription className="text-muted-foreground mt-1">Add a new user account to the enterprise system</DialogDescription></DialogHeader>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5"><Label htmlFor="newUserRole">User Role</Label><select id="newUserRole" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'employee')} className="w-full p-2 border border-input rounded-md bg-background focus:border-primary focus:ring-1 focus:ring-primary h-10 text-sm"><option value="employee">Employee</option><option value="admin">Administrator</option></select></div>
                    <div className="space-y-1.5"><Label htmlFor="newUserId">User ID</Label><Input id="newUserId" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} placeholder="e.g., jsmith"/></div>
                    <div className="space-y-1.5"><Label htmlFor="newUserName">Full Name</Label><Input id="newUserName" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="e.g., John Smith"/></div>
                    {newUserRole === 'admin' && (<><div className="space-y-1.5"><Label htmlFor="newUserPassword">Password</Label><Input type="password" id="newUserPassword" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Enter secure password"/></div><div className="space-y-1.5"><Label htmlFor="confirmNewUserPassword">Confirm Password</Label><Input type="password" id="confirmNewUserPassword" value={confirmNewUserPassword} onChange={(e) => setConfirmNewUserPassword(e.target.value)} placeholder="Confirm admin password" className={`${newUserPassword && confirmNewUserPassword && newUserPassword !== confirmNewUserPassword ? 'border-destructive ring-destructive' : ''}`}/></div></>)}
                    {newUserRole === 'employee' && (<div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-sm text-primary"><div className="flex items-start"><div className="flex-shrink-0 pt-0.5"><HelpCircle size={16} className="text-primary" /></div><div className="ml-2"><p className="text-sm font-medium">Employees log in using One-Time Passwords (OTPs)</p><p className="text-xs mt-1">After creating the account, you'll need to generate an OTP for this user's first login via the User Management list.</p></div></div></div>)}
                    {errorMessage && (<div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive flex items-start"><AlertTriangle size={16} className="mt-0.5 flex-shrink-0" /><p className="ml-2">{errorMessage}</p></div>)}
                    <div className="pt-3"><Button onClick={handleAddUserSubmit} disabled={isAddingUser} className="w-full h-10">{isAddingUser ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</>) : ('Create Account')}</Button></div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card className="border shadow-md rounded-xl overflow-hidden bg-card"><Accordion type="multiple" className="w-full" defaultValue={["employee-accounts"]}>
                <AccordionItem value="employee-accounts"><AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors data-[state=open]:bg-muted/30 data-[state=open]:border-b"><div className="flex items-center gap-2 sm:gap-3"><div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0"><Briefcase size={16} className="text-primary" /></div><div className="text-left"><p className="font-semibold text-sm sm:text-base">Employee Accounts</p><p className="text-xs text-muted-foreground">Manage standard user accounts</p></div></div></AccordionTrigger><AccordionContent className="p-0 border-t bg-background">{renderUserList(users, 'employee')}</AccordionContent></AccordionItem>
                <AccordionItem value="admin-accounts"><AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors data-[state=open]:bg-muted/30 data-[state=open]:border-b-0"><div className="flex items-center gap-2 sm:gap-3"><div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0"><User size={16} className="text-accent" /></div><div className="text-left"><p className="font-semibold text-sm sm:text-base">Administrator Accounts</p><p className="text-xs text-muted-foreground">Manage privileged user accounts</p></div></div></AccordionTrigger><AccordionContent className="p-0 border-t bg-background">{renderUserList(admins, 'admin')}</AccordionContent></AccordionItem>
            </Accordion></Card>
          </section>

          <section id="enterprise-tools-section" className="space-y-6 scroll-mt-24 md:scroll-mt-32">
            <div><h3 className="text-xl font-bold text-foreground">Enterprise Tools</h3><p className="text-sm text-muted-foreground mt-1">Access authorized enterprise applications</p></div>
            <div className="space-y-4">
              <Card onClick={handleBOPPAccess} className="border shadow-md rounded-xl overflow-hidden hover:shadow-xl transition-all cursor-pointer group bg-gradient-to-br from-card to-muted/30">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4"><div className="bg-green-500/10 text-green-700 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"><Calculator size={24} /></div><div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center group-hover:bg-green-500/20 transition-colors">{isNavigatingToBopp ? (<Loader2 size={20} className="text-green-600 animate-spin" />) : (<ChevronRight size={20} className="text-muted-foreground group-hover:text-green-600 transition-colors" />)}</div></div>
                  <h4 className="text-lg font-semibold text-foreground mb-1">{companyName} BOPP Tape Calculator</h4><p className="text-sm text-muted-foreground mb-3">Advanced computation tool for BOPP tape parameters and specifications</p>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1"><Badge variant="outline" className="text-xs">Manufacturing</Badge><Badge variant="outline" className="text-xs">Engineering</Badge></div>
                </div>
              </Card>
            </div>
          </section>
        </div>
      </main>

      <AlertDialog open={otpDisplayInfo.isOpen} onOpenChange={(open) => setOtpDisplayInfo(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent className="bg-card rounded-lg max-w-md text-card-foreground">
          <AlertDialogHeader className="space-y-2"><AlertDialogTitle className="text-xl font-bold">One-Time Password</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground">Generated for <span className="font-medium text-primary">{otpDisplayInfo.userName}</span>. Valid for 5 minutes only.</AlertDialogDescription></AlertDialogHeader>
          <div className="my-4"><div className="flex items-center justify-center space-x-3 bg-primary/10 p-6 rounded-md border border-primary/20"><span className="text-3xl font-mono tracking-widest text-primary font-bold">{otpDisplayInfo.otp || "Error"}</span><Button variant="outline" size="icon" onClick={() => copyToClipboard(otpDisplayInfo.otp)} className="h-9 w-9 border-primary/30 text-primary hover:bg-primary/20" title="Copy OTP"><Copy size={18} /></Button></div><p className="text-xs sm:text-sm text-muted-foreground mt-3 text-center">Share this code with {otpDisplayInfo.userName} securely. It cannot be recovered after closing this window.</p></div>
          <AlertDialogFooter><AlertDialogAction className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">Close</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent className="bg-card rounded-lg max-w-md text-card-foreground">
          <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2 text-xl font-semibold"><AlertTriangle className="h-6 w-6 text-destructive" />Confirm User Deletion</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground pt-2">Are you absolutely sure you want to delete the user <span className="font-semibold text-foreground">"{deleteConfirmation.userName}"</span> (ID: <span className="font-semibold text-foreground">{deleteConfirmation.userId}</span>)?<br /><span className="font-medium text-destructive">This action cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="mt-4"><AlertDialogCancel onClick={() => setDeleteConfirmation({ isOpen: false, userId: null, userName: null })}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={actionLoading[`delete_${deleteConfirmation.userId || ''}`]}>{actionLoading[`delete_${deleteConfirmation.userId || ''}`] ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>) : ("Yes, Delete User")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="bg-card border-t text-muted-foreground py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center"><Image src="/assets/JM-logo.png" alt={companyName} width={32} height={32} className="rounded mr-2"/><span className="font-semibold text-foreground text-sm">{companyName}</span></div>
            <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm"><Button variant="link" size="sm" className="text-muted-foreground hover:text-primary p-0 h-auto">Privacy Policy</Button><Button variant="link" size="sm" className="text-muted-foreground hover:text-primary p-0 h-auto">Terms of Service</Button><Button variant="link" size="sm" className="text-muted-foreground hover:text-primary p-0 h-auto">Contact Support</Button></div>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground/80">
            <p className="text-xs sm:text-sm">© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
            <p className="text-xs sm:text-sm mt-2 md:mt-0">Upteky Solution Pvt. Ltd.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AdminDashboardPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardContent />
        </ProtectedRoute>
    );
}

    