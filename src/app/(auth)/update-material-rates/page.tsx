
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
import { Loader2, Save, RotateCcw, HistoryIcon } from "lucide-react";
import type { BoppRate } from "@/lib/types";
import { getMaterialRates, updateMaterialRatesAction } from "@/lib/actions/bopp_rates_actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

const materialRateSchema = z.object({
  key: z.string(),
  value: z.coerce.number().nonnegative("Rate must be non-negative"),
});

const materialRatesSchema = z.object({
  rates: z.array(materialRateSchema),
});

type MaterialRatesFormValues = z.infer<typeof materialRatesSchema>;

interface RateChangeSummary {
  key: string;
  oldValue: number;
  newValue: number;
}

const rateCategories = [
  {
    title: "Print Type Rates",
    keys: [
      "natural",
      "single_colour_printed",
      "double_colour_printed",
      "three_colour_printed",
      "four_colour_printed",
      "full_print",
    ],
  },
  {
    title: "Tape/Paste Type Rates",
    keys: ["transparent", "milky_white", "brown_tape", "color_tape"],
  },
  {
    title: "Base Material Rates",
    keys: ["bopp_film_rate", "adhesive_rate"],
  },
  {
    title: "Process & Overhead Rates",
    keys: ["adhesive_less_rate", "coating_exp", "packing_cost", "profit"],
  },
];


export default function UpdateMaterialRatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRatesLoading, setIsRatesLoading] = useState(true);
  const [currentRates, setCurrentRates] = useState<BoppRate[]>([]);
  const [initialRates, setInitialRates] = useState<BoppRate[]>([]);
  const [changeSummary, setChangeSummary] = useState<RateChangeSummary[]>([]);

  const materialRatesForm = useForm<MaterialRatesFormValues>({
    resolver: zodResolver(materialRatesSchema),
    defaultValues: { rates: [] },
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/employee/dashboard'); // Redirect if not admin
      toast({ title: "Access Denied", description: "You do not have permission to access this page.", variant: "destructive" });
    } else if (user) {
      fetchRates();
    }
  }, [user, router, toast]);

  useEffect(() => {
    // Sort currentRates according to categories for consistent order in the form
    const sortedRates = [];
    const rateMap = new Map(currentRates.map(rate => [rate.key, rate]));
    const allCategorizedKeys = new Set<string>();

    rateCategories.forEach(category => {
      category.keys.forEach(key => {
        if (rateMap.has(key)) {
          sortedRates.push(rateMap.get(key)!);
          allCategorizedKeys.add(key);
        }
      });
    });
    // Add any rates not in defined categories at the end
    // This ensures that if a rate is in the DB but not in a category, it's still part of the form data for save
    // but won't be rendered if we only loop through categorized keys for rendering.
    currentRates.forEach(rate => {
      if (!allCategorizedKeys.has(rate.key)) {
        sortedRates.push(rate);
      }
    });
    
    materialRatesForm.reset({ rates: sortedRates.map(r => ({ key: r.key, value: r.value })) });
  }, [currentRates, materialRatesForm]);

  // Calculate change summary when form values change
  useEffect(() => {
    const subscription = materialRatesForm.watch((value, { name, type }) => {
      if (type === 'change' && value.rates) {
        const summary: RateChangeSummary[] = [];
        value.rates.forEach(formRate => {
          const initialRate = initialRates.find(ir => ir.key === formRate.key);
          if (initialRate && initialRate.value !== formRate.value) {
            summary.push({ key: formRate.key, oldValue: initialRate.value, newValue: formRate.value });
          }
        });
        setChangeSummary(summary);
      }
    });
    return () => subscription.unsubscribe();
  }, [materialRatesForm, initialRates]);

  async function fetchRates() {
    setIsRatesLoading(true);
    const response = await getMaterialRates();
    if (response.success && response.rates) {
      setCurrentRates(response.rates);
      setInitialRates(JSON.parse(JSON.stringify(response.rates))); // Deep copy for reset
    } else {
      toast({ title: "Error", description: response.error || "Failed to fetch material rates.", variant: "destructive" });
    }
    setIsRatesLoading(false);
  }

  const handleSaveChanges = async (data: MaterialRatesFormValues) => {
    if (!user || user.role !== 'admin') return;
    setIsLoading(true);
    const ratesToUpdate: BoppRate[] = data.rates.map(formRate => {
      const originalRate = initialRates.find(r => r.key === formRate.key); // Find by key to get original ID
      return {
        id: originalRate?.id,
        key: formRate.key,
        value: formRate.value,
      };
    });

    const response = await updateMaterialRatesAction(ratesToUpdate, user.id, user.name);
    if (response.success) {
      toast({ title: "Success", description: response.message });
      fetchRates(); // Re-fetch to confirm and update initialRates
      setChangeSummary([]); // Clear summary after save
    } else {
      toast({ title: "Error", description: response.error, variant: "destructive" });
    }
    setIsLoading(false);
  };
  
  const handleResetRates = () => {
     // Ensure initialRates are sorted in the same way as form for proper reset
    const sortedInitialRates = [];
    const initialRateMap = new Map(initialRates.map(rate => [rate.key, rate]));
    const allCategorizedKeys = new Set<string>();

    rateCategories.forEach(category => {
        category.keys.forEach(key => {
            if (initialRateMap.has(key)) {
                sortedInitialRates.push(initialRateMap.get(key)!);
                allCategorizedKeys.add(key);
            }
        });
    });
    initialRates.forEach(rate => {
        if (!allCategorizedKeys.has(rate.key)) {
            sortedInitialRates.push(rate);
        }
    });

    materialRatesForm.reset({ rates: sortedInitialRates.map(r => ({ key: r.key, value: r.value })) });
    setChangeSummary([]);
    toast({ title: "Rates Reset", description: "Changes have been reverted to last saved state." });
  };

  if (!user || user.role !== 'admin') {
     return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Redirecting...</p></div>;
  }

  const formRates = materialRatesForm.watch('rates');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Update Material Rates</h1>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit Rates</CardTitle>
            <CardDescription>Modify the standard material rates used in calculations.</CardDescription>
          </CardHeader>
          {isRatesLoading ? <CardContent><div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div></CardContent> :
          <Form {...materialRatesForm}>
            <form onSubmit={materialRatesForm.handleSubmit(handleSaveChanges)}>
              <CardContent className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                {rateCategories.map((category) => (
                  <div key={category.title} className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-3">{category.title}</h3>
                    {category.keys.map((rateKey) => {
                      const rateIndex = formRates.findIndex(r => r.key === rateKey);
                      if (rateIndex === -1) return null; // Rate not found in form 
                      
                      const rate = formRates[rateIndex];
                      return (
                        <FormField
                          key={rate.key}
                          control={materialRatesForm.control}
                          name={`rates.${rateIndex}.value`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                              <FormLabel className="capitalize font-medium text-sm flex-1 min-w-[180px] md:min-w-[200px]">{rate.key.replace(/_/g, ' ')}</FormLabel>
                              <FormControl className="md:w-1/3">
                                <Input type="number" step="0.0001" {...field} 
                                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage className="md:w-auto text-xs"/>
                            </FormItem>
                          )}
                        />
                      );
                    })}
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-6 border-t">
                 <Link href="/rate-history" passHref>
                    <Button variant="outline" type="button" className="w-full sm:w-auto"><HistoryIcon className="mr-2 h-4 w-4" /> View History</Button>
                 </Link>
                <Button variant="outline" type="button" onClick={handleResetRates} disabled={isLoading || changeSummary.length === 0} className="w-full sm:w-auto">
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset Changes
                </Button>
                <Button type="submit" disabled={isLoading || changeSummary.length === 0} className="w-full sm:w-auto">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                </Button>
              </CardFooter>
            </form>
          </Form>
          }
        </Card>

        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Change Summary</CardTitle>
                <CardDescription>Overview of unsaved modifications.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto">
                {changeSummary.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No changes made yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {changeSummary.map(change => (
                            <li key={change.key} className="text-sm p-2 border rounded-md bg-muted/50">
                                <strong className="capitalize block">{change.key.replace(/_/g, ' ')}:</strong>
                                <span className="text-destructive line-through">{change.oldValue.toFixed(4)}</span>
                                <span className="text-green-600"> → {change.newValue.toFixed(4)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

