
"use server";

import type { BoppCalculatorInputs, BoppCalculationResult, BoppRate, PrintTypeRateKey, PasteTypeRateKey } from "@/lib/types";
import { getBoppRates as fetchRatesFromDb, updateBoppRates as updateRatesInDb, getRateHistory as fetchRateHistoryFromDb } from "@/lib/db";

// Helper to get a rate value from the BoppRate array.
function getRateValue(rates: BoppRate[], key: string): number | undefined {
  const rate = rates.find(r => r.key === key);
  return rate?.value;
}

function performCalculation(inputs: BoppCalculatorInputs, dbRatesArray: BoppRate[]): BoppCalculationResult | { error: string } {
  const {
    boppFilmThickness,
    adhesiveThickness,
    tapeLength,
    metersForCorelessCalc, // This will now be used for R36
    printType,
    pasteType,
  } = inputs;

  // Map BoppRate[] to a Record<string, number> for easier lookup based on the 'calculateOutputs' example structure.
  // However, we'll fetch directly using getRateValue for clarity with our BoppRate[] type.
  const BOPP_FILM_RATE_PRINTED = getRateValue(dbRatesArray, printType);
  const PASTE_RATE = getRateValue(dbRatesArray, pasteType);
  const ADHESIVE_RATE = getRateValue(dbRatesArray, 'adhesive_rate');
  const RAW_BOPP_RATE = getRateValue(dbRatesArray, 'bopp_film_rate');
  const PACKING_COST = getRateValue(dbRatesArray, 'packing_cost');
  const COATING_EXP = getRateValue(dbRatesArray, 'coating_exp');
  const PROFIT_DB_VAL = getRateValue(dbRatesArray, 'profit');
  const ADHESIVE_LESS_RATE = getRateValue(dbRatesArray, 'adhesive_less_rate');

  const missingOrInvalid: string[] = [];
  if (boppFilmThickness === undefined || boppFilmThickness <= 0) missingOrInvalid.push("BOPP Film Thickness (must be > 0)");
  if (adhesiveThickness === undefined || adhesiveThickness <= 0) missingOrInvalid.push("Adhesive Thickness (must be > 0)");
  if (tapeLength === undefined || tapeLength <= 0) missingOrInvalid.push("Tape Length (must be > 0)");
  if (metersForCorelessCalc === undefined || metersForCorelessCalc <= 0) missingOrInvalid.push("Total Meters (for Batch Calc) (must be > 0)");
  if (printType === undefined || printType === '') missingOrInvalid.push("Print Type Selection");
  if (pasteType === undefined || pasteType === '') missingOrInvalid.push("Paste Type Selection");

  if (BOPP_FILM_RATE_PRINTED === undefined) missingOrInvalid.push(`DB Rate for Print Type: ${printType}`);
  if (PASTE_RATE === undefined) missingOrInvalid.push(`DB Rate for Paste Type: ${pasteType}`);
  if (ADHESIVE_RATE === undefined) missingOrInvalid.push("DB Rate: adhesive_rate");
  if (RAW_BOPP_RATE === undefined) missingOrInvalid.push("DB Rate: bopp_film_rate");
  if (PACKING_COST === undefined) missingOrInvalid.push("DB Rate: packing_cost");
  if (COATING_EXP === undefined) missingOrInvalid.push("DB Rate: coating_exp");
  if (PROFIT_DB_VAL === undefined) missingOrInvalid.push("DB Rate: profit");
  if (ADHESIVE_LESS_RATE === undefined) missingOrInvalid.push("DB Rate: adhesive_less_rate (must be >=0)");

  if (missingOrInvalid.length > 0) {
    console.error("Missing/Invalid Inputs or DB Rates:", missingOrInvalid);
    return { error: `Missing or invalid inputs/rates: ${missingOrInvalid.join(', ')}.` };
  }
  
  const PROFIT_PERCENTAGE = (PROFIT_DB_VAL as number) / 100;
  
  // Use inputs directly: boppFilmThickness, adhesiveThickness, tapeLength
  // Use metersForCorelessCalc for R36 in calculations
  const R36_calc_value = metersForCorelessCalc;

  const y = adhesiveThickness + 1;
  const x = boppFilmThickness + y;
  const bopp_film_wt = 0.20925 * boppFilmThickness;
  const adhesive_wt = (((x * 0.94 * 225) / 1000) - bopp_film_wt) / 53.5 * 100;
  const paste_wt = adhesive_wt * 0.06;

  const materialCostNumerator = (bopp_film_wt * (RAW_BOPP_RATE as number)) + 
                                (adhesive_wt * (ADHESIVE_RATE as number)) + 
                                (BOPP_FILM_RATE_PRINTED as number) + 
                                (COATING_EXP as number) - 
                                (adhesive_wt * 0.06 * (ADHESIVE_LESS_RATE as number)) + 
                                (paste_wt * (PASTE_RATE as number));

  const R2_val = (((materialCostNumerator / 65) * tapeLength + (PACKING_COST as number)) / 72) * (1 + PROFIT_PERCENTAGE) * 72 + 20;
  const R45_val = (((materialCostNumerator / 65) * 65 + (PACKING_COST as number)) / 72) * (1 + PROFIT_PERCENTAGE) * 72 + 20;

  const R1_val = x - 1;
  const R3_val = 1315;
  const R4_val = (materialCostNumerator / ((adhesive_wt * 0.54) + bopp_film_wt)) * 1.05;
  const R5_val = null;
  const R6_val = R4_val + 5;

  const R7_val = x * 4.873;
  const R8_val = R7_val / 1315 * 1610;
  const R9_val = x * 0.2668;
  const R10_val = null;

  const R11_val = (x * 0.00027115 * tapeLength) + (tapeLength / 6500) + 0.16;
  const R12_val = R11_val * 12 + 0.75;
  const R13_val = (R7_val * R4_val) / 5260;
  const R14_val = R11_val / 6;

  const R16_val = R2_val / 144;
  const R15_val = R16_val / 2;
  const R17_val = R2_val / 96;
  const R18_val = R2_val / 72;
  const R20_val = R18_val * 1.5;
  const R19_val = R2_val / 72 / 48 * 60;
  const R21_val = R18_val * 2;

  const R35_val = tapeLength;
  const R34_val = 72;
  const R38_val = -2.38;

  const R37_val = R36_calc_value / 65; // Use R36_calc_value
  const R39_val = R37_val + R38_val;
  const R40_val = 20 / 10.5;

  const R46_val = R45_val / R34_val / 65 * R36_calc_value; // Use R36_calc_value
  const R47_val = R39_val - R40_val;
  const R48_val = R46_val - R47_val;

  const R22_val = R48_val * 3;
  const R23_val = R48_val;
  const R27_val = R48_val * 0.375;
  const R25_val = R27_val * 2;
  const R24_val = R23_val * 1.5;
  const R28_val = R48_val / 48 * 20;
  const R26_val = R28_val * 3;
  const R49_val = R48_val * 3;

  const R29_val = null; const R30_val = null; const R31_val = null; const R32_val = null;
  const R33_val = null;
  const R41_val = null; const R42_val = null; const R43_val = null; const R44_val = null;

  const calculatedTotalCost = R2_val * (metersForCorelessCalc > 0 && tapeLength > 0 ? metersForCorelessCalc / tapeLength : 0);

  return {
    totalCost: parseFloat(calculatedTotalCost.toFixed(2)),
    costPerPiece: parseFloat(R2_val.toFixed(2)),
    bopp_tape_mtrs: tapeLength,
    R1: R1_val, R2: R2_val, R3: R3_val, R4: R4_val, R5: R5_val, R6: R6_val, R7: R7_val, R8: R8_val, R9: R9_val, R10: R10_val,
    R11: R11_val, R12: R12_val, R13: R13_val, R14: R14_val, R15: R15_val, R16: R16_val, R17: R17_val, R18: R18_val, R19: R19_val, R20: R20_val, R21: R21_val,
    R22: R22_val, R23: R23_val, R24: R24_val, R25: R25_val, R26: R26_val, R27: R27_val, R28: R28_val,
    R29: R29_val, R30: R30_val, R31: R31_val, R32: R32_val, R33: R33_val,
    R34: R34_val, R35: R35_val, R36: R36_calc_value, // R36 is now from metersForCorelessCalc
    R37: R37_val, R38: R38_val, R39: R39_val, R40: R40_val,
    R41: R41_val, R42: R42_val, R43: R43_val, R44: R44_val,
    R45: R45_val, R46: R46_val, R47: R47_val, R48: R48_val, R49: R49_val,
  };
}

export async function calculateBoppTapeCost(inputs: BoppCalculatorInputs): Promise<{ success: boolean; result?: BoppCalculationResult; error?: string; rates?: BoppRate[] }> {
  try {
    const currentRates = await fetchRatesFromDb();
    if (!currentRates || currentRates.length === 0) {
      console.error("Material rates not available from DB.");
      return { success: false, error: "Material rates not available. Please contact admin." };
    }
    
    const calculationOutput = performCalculation(inputs, currentRates);

    if ('error' in calculationOutput) {
        return { success: false, error: calculationOutput.error, rates: currentRates };
    }

    return { success: true, result: calculationOutput, rates: currentRates };
  } catch (error) {
    console.error("BOPP Calculation Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to calculate cost due to an unexpected server error.";
    return { success: false, error: errorMessage };
  }
}

export async function getMaterialRates(): Promise<{ success: boolean; rates?: BoppRate[]; error?: string }> {
  try {
    const rates = await fetchRatesFromDb();
    return { success: true, rates };
  } catch (error) {
    console.error("Fetch Material Rates Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch material rates.";
    return { success: false, error: errorMessage };
  }
}

export async function updateMaterialRatesAction(
  newRates: BoppRate[], 
  changedById: string, 
  changedByName: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await updateRatesInDb(newRates, changedById, changedByName);
    return { success: true, message: "Material rates updated successfully." };
  } catch (error) {
    console.error("Update Material Rates Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update material rates.";
    return { success: false, error: errorMessage };
  }
}

export async function getRateHistoryAction(limit: number = 5): Promise<{ success: boolean; history?: any[]; error?: string }> {
  try {
    const history = await fetchRateHistoryFromDb(limit);
     const parsedHistory = history.map(h => {
        let ratesSnapshot = h.rates_snapshot;
        if (typeof ratesSnapshot === 'string') {
            try {
                ratesSnapshot = JSON.parse(ratesSnapshot);
            } catch (e) {
                console.error(`Failed to parse rates_snapshot for history ID ${h.id}:`, e);
                ratesSnapshot = []; 
            }
        }
        return { ...h, rates_snapshot: ratesSnapshot };
    });
    return { success: true, history: parsedHistory };
  } catch (error) {
    console.error("Fetch Rate History Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch rate history.";
    return { success: false, error: errorMessage };
  }
}

