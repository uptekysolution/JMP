
"use server";

import type { AuthenticatedUser, Role } from "@/lib/types";
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE_PATH = path.join(DATA_DIR, 'users.json');

// Initial default users (used if JSON file is missing on first run)
const initialMockUsers: AuthenticatedUser[] = [
  { id: "admin", name: "Administrator", role: "admin" }, // Primary admin
  { id: "employee", name: "Default Employee", role: "employee" },
  { id: "emp001", name: "Alice Smith", role: "employee" },
  { id: "adm001", name: "Bob Johnson (Admin)", role: "admin" },
];

async function ensureDataDirExists() {
    try {
        await fs.access(DATA_DIR);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(DATA_DIR, { recursive: true });
            console.log(`Created data directory at ${DATA_DIR}`);
        } else {
            throw error;
        }
    }
}

async function loadUsersFromFile(): Promise<AuthenticatedUser[]> {
    await ensureDataDirExists();
    try {
        const fileContent = await fs.readFile(USERS_FILE_PATH, 'utf-8');
        const usersFromFile = JSON.parse(fileContent);
        // Ensure otp_created_at is converted to Date objects
        return usersFromFile.map((u: any) => ({
            ...u,
            otp_created_at: u.otp_created_at ? new Date(u.otp_created_at) : undefined,
        }));
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log(`Users file not found. Initializing with defaults and saving to ${USERS_FILE_PATH}`);
            await fs.writeFile(USERS_FILE_PATH, JSON.stringify(initialMockUsers, null, 2));
            return initialMockUsers.map(u => ({...u})); // Return a copy
        }
        console.error(`Error reading users file (${USERS_FILE_PATH}), returning initial defaults:`, error);
        return initialMockUsers.map(u => ({...u})); // Return a copy
    }
}

async function saveUsersToFile(users: AuthenticatedUser[]) {
    await ensureDataDirExists();
    // Before saving, ensure otp_created_at is a string or null for JSON compatibility
    const usersToSave = users.map(u => ({
        ...u,
        otp_created_at: u.otp_created_at instanceof Date ? u.otp_created_at.toISOString() : null,
    }));
    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(usersToSave, null, 2));
}


export interface UserDetailsResponse {
  success: boolean;
  user?: { id: string; name: string; role: Role };
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

export interface BasicResponse {
  success: boolean;
  message?: string;
  error?: string;
  otp?: string;
}

export async function fetchUserDetails(userId: string): Promise<UserDetailsResponse> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Reduced delay
  const users = await loadUsersFromFile();
  const user = users.find(u => u.id.toLowerCase() === userId.toLowerCase());

  if (user) {
    return { success: true, user: { id: user.id, name: user.name, role: user.role } };
  }
  return { success: false, error: "User not found" };
}

export async function loginUser(userId: string, password?: string): Promise<LoginResponse> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const users = await loadUsersFromFile();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (user.role === "admin") {
    if (user.id === "admin" && password === "admin") {
      return { success: true, user: { id: user.id, name: user.name, role: user.role } };
    }
    // For other admin users, check if password was set (not really implemented in mock)
    if (user.id !== "admin" && user.password === password) { // Assuming a password field might exist for other admins
        return { success: true, user: { id: user.id, name: user.name, role: user.role } };
    }
    return { success: false, error: "Invalid credentials for this admin user." };
  }

  return { success: false, error: "Login method not applicable for this user type here." };
}

export async function generateAndStoreOTP(userId: string): Promise<BasicResponse> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const users = await loadUsersFromFile();
  const userIndex = users.findIndex(u => u.id === userId && u.role === "employee");

  if (userIndex !== -1) {
    const user = users[userIndex];
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = newOtp;
    user.otp_created_at = new Date();
    await saveUsersToFile(users);
    console.log(`[generateAndStoreOTP] User: ${userId}, Role: ${user.role}, Generated OTP: "${user.otp}", Created At: ${user.otp_created_at.toISOString()}`);
    return { success: true, otp: newOtp, message: "OTP generated successfully." };
  }
  console.log(`[generateAndStoreOTP] User not found or not employee: ${userId}`);
  return { success: false, error: "Failed to generate OTP. User not found or not an employee." };
}

export async function verifyOtp(userId: string, otp: string): Promise<LoginResponse> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const users = await loadUsersFromFile();
  const user = users.find(u => u.id === userId && u.role === "employee");

  console.log(`[verifyOtp] Attempting to verify for User ID: "${userId}", OTP entered: "${otp}"`);

  if (!user) {
    console.log(`[verifyOtp] User not found for ID: "${userId}"`);
    return { success: false, error: "User not found" };
  }

  console.log(`[verifyOtp] User found: ${user.name}. Stored OTP: "${user.otp}", Stored OTP Created At: ${user.otp_created_at ? (user.otp_created_at instanceof Date ? user.otp_created_at.toISOString() : user.otp_created_at) : 'N/A'}`);

  if (!user.otp || !user.otp_created_at) {
    console.log(`[verifyOtp] No active OTP found for user "${userId}".`);
    return { success: false, error: "No active OTP found for this user. Please generate one." };
  }

  let otpCreatedAtTime: number;
  if (user.otp_created_at instanceof Date) {
    otpCreatedAtTime = user.otp_created_at.getTime();
  } else {
    const parsedDate = new Date(user.otp_created_at); // Should already be a Date object from loadUsersFromFile
    if (isNaN(parsedDate.getTime())) {
        console.error(`[verifyOtp] Invalid date format for otp_created_at for user "${userId}": ${user.otp_created_at}`);
        return { success: false, error: "Internal error processing OTP timestamp. Contact admin." };
    }
    otpCreatedAtTime = parsedDate.getTime();
  }

  const now = new Date();
  const otpAge = now.getTime() - otpCreatedAtTime;
  const fiveMinutes = 5 * 60 * 1000;

  if (otpAge > fiveMinutes) {
    console.log(`[verifyOtp] OTP expired for user "${userId}". Age: ${otpAge}ms. Expiry limit: ${fiveMinutes}ms`);
    return { success: false, error: "OTP has expired. Please generate a new one." };
  }

  if (otp === user.otp) {
    console.log(`[verifyOtp] OTP Success for user "${userId}". Entered: "${otp}", Stored: "${user.otp}"`);
    // Optionally clear OTP after successful verification:
    // const userToUpdate = users.find(u => u.id === userId);
    // if (userToUpdate) {
    //   userToUpdate.otp = undefined;
    //   userToUpdate.otp_created_at = undefined;
    //   await saveUsersToFile(users);
    // }
    return { success: true, user: { id: user.id, name: user.name, role: user.role } };
  }

  console.log(`[verifyOtp] Invalid OTP for user "${userId}". Entered: "${otp}", Stored: "${user.otp}"`);
  return { success: false, error: "Invalid OTP" };
}

export async function addUser(userId: string, userName: string, passwordProvided: string, role: Role): Promise<BasicResponse> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const users = await loadUsersFromFile();
  const existingUserById = users.find(u => u.id.toLowerCase() === userId.toLowerCase());
  if (existingUserById) {
    return { success: false, error: "User with this ID already exists." };
  }

  const newUser: AuthenticatedUser = {
    id: userId,
    name: userName,
    role: role,
  };
  if (role === 'admin') {
      newUser.password = passwordProvided; // In real app, hash this
  }
  users.push(newUser);
  await saveUsersToFile(users);
  console.log("Added user:", newUser);
  return { success: true, message: `User ${userName} added successfully.` };
}

export async function deleteUser(userIdToDelete: string): Promise<BasicResponse> {
  await new Promise(resolve => setTimeout(resolve, 50));
  let users = await loadUsersFromFile();
  if (userIdToDelete === "admin" || userIdToDelete === "employee") {
    console.log(`Attempted to delete protected user: ${userIdToDelete}`);
    return { success: false, error: `The default '${userIdToDelete}' account cannot be deleted.` };
  }

  const initialLength = users.length;
  users = users.filter(u => u.id !== userIdToDelete);

  if (users.length < initialLength) {
    await saveUsersToFile(users);
    console.log("Deleted user with ID:", userIdToDelete);
    return { success: true, message: "User deleted successfully." };
  }
  console.log(`User not found for deletion: ${userIdToDelete}`);
  return { success: false, error: "User not found." };
}

export async function updateAdminDetails(adminId: string, name: string, newPassword?: string): Promise<BasicResponse> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const users = await loadUsersFromFile();
  const adminUser = users.find(u => u.id === adminId && u.role === "admin");
  if (!adminUser) {
    return { success: false, error: "Admin user not found." };
  }
  if (name) adminUser.name = name;
  if (newPassword) {
    adminUser.password = newPassword; // In real app, hash this
    console.log(`Admin ${adminId} password updated.`);
  }
  await saveUsersToFile(users);
  return { success: true, message: "Admin details updated successfully." };
}

export async function getAllUsers(): Promise<AuthenticatedUser[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return await loadUsersFromFile(); // loadUsersFromFile already handles Date conversion
}

export async function revokeOTP(userId: string): Promise<BasicResponse> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const users = await loadUsersFromFile();
  const user = users.find(u => u.id === userId && u.role === "employee");
  if (user) {
    user.otp = undefined;
    user.otp_created_at = undefined;
    await saveUsersToFile(users);
    console.log(`[revokeOTP] OTP for ${user.name} (ID: ${userId}) has been revoked.`);
    return { success: true, message: `OTP for ${user.name} has been revoked.` };
  }
  console.log(`[revokeOTP] User not found or not an employee: ${userId}`);
  return { success: false, error: "User not found or not an employee." };
}
