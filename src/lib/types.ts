
export type Role = "admin" | "employee";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface AuthenticatedUser extends User {
  otp?: string; // The OTP code itself
  otp_created_at?: Date; // When the OTP was generated
}

export interface BoppRate {
  id?: number;
  key: string;
  value: number;
}

export interface BoppRateHistory {
  id?: number;
  changed_at: Date;
  changed_by_id: string;
  changed_by_name: string;
  rates_snapshot: BoppRate[]; // JSON in DB, parsed here
}

// Define the keys for print types that will be selectable
export const printTypeRateKeys = [
  "natural",
  "single_colour_printed",
  "double_colour_printed",
  "three_colour_printed",
  "four_colour_printed",
  "full_print",
] as const;

export type PrintTypeRateKey = typeof printTypeRateKeys[number];

export const pasteTypeRateKeys = [
  "transparent",
  "milky_white",
  "brown_tape",
  "color_tape",
] as const;

export type PasteTypeRateKey = typeof pasteTypeRateKeys[number];


export interface BoppCalculatorInputs {
  boppFilmThickness: number;
  adhesiveThickness: number;
  tapeLength: number;
  metersForCorelessCalc: number;
  printType: PrintTypeRateKey;
  pasteType: PasteTypeRateKey;
}

export interface BoppCalculationResult {
  // Core financial results, derived from R-values
  totalCost: number;
  costPerPiece: number; // This will be R2

  // Input parameter for display
  bopp_tape_mtrs: number;

  // All R-values
  R1: number | null;
  R2: number | null;
  R3: number | null;
  R4: number | null;
  R5: number | null;
  R6: number | null;
  R7: number | null;
  R8: number | null;
  R9: number | null;
  R10: number | null;
  R11: number | null;
  R12: number | null;
  R13: number | null;
  R14: number | null;
  R15: number | null;
  R16: number | null;
  R17: number | null;
  R18: number | null;
  R19: number | null;
  R20: number | null;
  R21: number | null;
  R22: number | null;
  R23: number | null;
  R24: number | null;
  R25: number | null;
  R26: number | null;
  R27: number | null;
  R28: number | null;
  R29: number | null;
  R30: number | null;
  R31: number | null;
  R32: number | null;
  R33: number | null;
  R34: number | null;
  R35: number | null;
  R36: number | null;
  R37: number | null;
  R38: number | null;
  R39: number | null;
  R40: number | null;
  R41: number | null;
  R42: number | null;
  R43: number | null;
  R44: number | null;
  R45: number | null;
  R46: number | null;
  R47: number | null;
  R48: number | null;
  R49: number | null;
}

export interface RateCardData extends Omit<BoppCalculatorInputs, 'printType' | 'pasteType' | 'metersForCorelessCalc'> {
  printType: string;
  pasteType: string;
  metersForCorelessCalc?: number;
  companyName?: string;
  date?: string;
  rates: BoppRate[];
  result: BoppCalculationResult;
  boppFilmThickness: number;
  adhesiveThickness: number;
  tapeLength: number;
}
