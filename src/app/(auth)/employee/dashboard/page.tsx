"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, UserCog } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function EmployeeDashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="flex justify-center items-center h-full"><p>Loading user data...</p></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col items-center text-center space-y-4 p-8 bg-card rounded-lg shadow-lg">
        <UserCog className="h-20 w-20 text-primary" />
        <h1 className="text-4xl font-bold text-primary">
          Welcome, {user.name}!
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          This is your personal dashboard. Access tools and manage your settings here.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calculator className="h-6 w-6 text-accent" />
              BOPP Tape Calculator
            </CardTitle>
            <CardDescription>
              Calculate costs for BOPP tape production based on various parameters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/bopp-calculator" passHref>
              <Button className="w-full">
                Open Calculator
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserCog className="h-6 w-6 text-accent" />
              My Settings
            </CardTitle>
            <CardDescription>
              View or update your personal account details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/employee/settings" passHref>
              <Button variant="outline" className="w-full">
                Go to Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
