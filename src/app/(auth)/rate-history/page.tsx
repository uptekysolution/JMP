"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, History } from "lucide-react";
import type { BoppRate, BoppRateHistory } from "@/lib/types";
import { getRateHistoryAction } from "@/lib/actions/bopp_rates_actions";
import { format } from 'date-fns';

function findRateByKey(rates: BoppRate[], key: string): BoppRate | undefined {
  return rates.find(rate => rate.key === key);
}

function RateDifferenceTable({ before, after }: { before?: BoppRate[], after: BoppRate[] }) {
  const allKeys = new Set([...(before?.map(r => r.key) || []), ...after.map(r => r.key)]);
  const differences: { key: string; oldValue?: number; newValue: number; change: string }[] = [];

  allKeys.forEach(key => {
    const oldRate = before ? findRateByKey(before, key) : undefined;
    const newRate = findRateByKey(after, key);

    if (newRate && (!oldRate || oldRate.value !== newRate.value)) {
      differences.push({
        key: key.replace(/_/g, ' '),
        oldValue: oldRate?.value,
        newValue: newRate.value,
        change: oldRate ? (newRate.value > oldRate.value ? 'increased' : 'decreased') : 'added'
      });
    } else if (newRate && oldRate && oldRate.value === newRate.value) {
      // Optionally show unchanged rates, or filter them out
      // For this example, we only show changes or new additions.
    }
  });
  
  if (differences.length === 0 && before) { // If there was a "before" state but no differences
      return <p className="text-sm text-muted-foreground">No changes in this snapshot compared to the previous one.</p>;
  }
  if (differences.length === 0 && !before) { // If it's the first snapshot
      return (
        <Table>
          <TableHeader><TableRow><TableHead>Rate Key</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader>
          <TableBody>
            {after.map(rate => (
              <TableRow key={rate.key}>
                <TableCell className="capitalize font-medium">{rate.key.replace(/_/g, ' ')}</TableCell>
                <TableCell className="text-right">{rate.value.toFixed(4)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
  }


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rate Key</TableHead>
          <TableHead className="text-right">Old Value</TableHead>
          <TableHead className="text-right">New Value</TableHead>
          <TableHead>Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {differences.map(diff => (
          <TableRow key={diff.key}>
            <TableCell className="capitalize font-medium">{diff.key}</TableCell>
            <TableCell className="text-right">{diff.oldValue !== undefined ? diff.oldValue.toFixed(4) : 'N/A'}</TableCell>
            <TableCell className="text-right font-semibold">{diff.newValue.toFixed(4)}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${
                diff.change === 'increased' ? 'bg-green-100 text-green-700' :
                diff.change === 'decreased' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {diff.change}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function RateHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [history, setHistory] = useState<BoppRateHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/employee/dashboard');
      toast({ title: "Access Denied", description: "You do not have permission to access this page.", variant: "destructive" });
    } else if (user) {
      fetchHistory();
    }
  }, [user, router, toast]);

  async function fetchHistory() {
    setIsLoading(true);
    const response = await getRateHistoryAction(5); // Fetch last 5 snapshots
    if (response.success && response.history) {
      // Ensure rates_snapshot is parsed if it's a string from DB mock
      const parsedHistory = response.history.map(h => ({
        ...h,
        rates_snapshot: typeof h.rates_snapshot === 'string' ? JSON.parse(h.rates_snapshot) : h.rates_snapshot
      }));
      setHistory(parsedHistory);
    } else {
      toast({ title: "Error", description: response.error || "Failed to fetch rate history.", variant: "destructive" });
    }
    setIsLoading(false);
  }

  if (!user || user.role !== 'admin') {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Redirecting...</p></div>;
  }
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <History className="mr-3 h-7 w-7 text-primary" />
            Material Rate Change History
          </CardTitle>
          <CardDescription>Review past changes to material rates. Showing last {history.length} snapshots.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No rate history found.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {history.map((entry, index) => (
                <AccordionItem value={`item-${index}`} key={entry.id || index}>
                  <AccordionTrigger className="hover:bg-muted/50 px-4 py-3 rounded-md">
                    <div className="flex justify-between w-full items-center">
                      <span className="font-semibold text-base">
                        {format(new Date(entry.changed_at), "PPpp")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Changed by: {entry.changed_by_name}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 border-t bg-background">
                    <h4 className="text-md font-semibold mb-3">Rate Changes:</h4>
                    <RateDifferenceTable
                      before={index + 1 < history.length ? history[index + 1].rates_snapshot : undefined}
                      after={entry.rates_snapshot}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
