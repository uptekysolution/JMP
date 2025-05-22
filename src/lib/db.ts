
import fs from 'fs/promises';
import path from 'path';
import type { BoppRate, BoppRateHistory } from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const RATES_FILE_PATH = path.join(DATA_DIR, 'bopp_rates.json');
const HISTORY_FILE_PATH = path.join(DATA_DIR, 'bopp_rate_history.json');

// Initial default rates (used if JSON file is missing on first run)
const initialDefaultRates: BoppRate[] = [
    { id: 1, key: 'adhesive_less_rate', value: 80.0000 },
    { id: 2, key: 'adhesive_rate', value: 90.0000 },
    { id: 3, key: 'bopp_film_rate', value: 118.0000 },
    { id: 4, key: 'brown_tape', value: 105.0000 }, // Used as a pasteType key
    { id: 5, key: 'coating_exp', value: 12.0000 },
    { id: 6, key: 'color_tape', value: 250.0000 }, // Used as a pasteType key
    { id: 7, key: 'double_colour_printed', value: 225.0000 },
    { id: 8, key: 'four_colour_printed', value: 350.0000 },
    { id: 9, key: 'full_print', value: 1000.0000 },
    { id: 10, key: 'milky_white', value: 160.0000 }, // Used as a pasteType key
    { id: 11, key: 'natural', value: 0.0000 }, 
    { id: 12, key: 'packing_cost', value: 60.0000 },
    { id: 13, key: 'profit', value: 10.0000 }, 
    { id: 14, key: 'single_colour_printed', value: 150.0000 },
    { id: 15, key: 'three_colour_printed', value: 300.0000 },
    { id: 16, key: 'transparent', value: 0.0000 }, // Used as a pasteType key
];

// Initial history (used if JSON file is missing on first run)
const initialMockRateHistory: BoppRateHistory[] = [
    {
      id: 1,
      changed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Two days ago
      changed_by_id: "system-init",
      changed_by_name: "System Initialization",
      rates_snapshot: [ 
        { id: 3, key: 'bopp_film_rate', value: 110.00 },
        { id: 2, key: 'adhesive_rate', value: 80.00 },
        { id: 12, key: 'packing_cost', value: 50.00 },
        { id: 13, key: 'profit', value: 7.00 },
      ]
    },
    {
      id: 2, 
      changed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
      changed_by_id: "system-init",
      changed_by_name: "System Initialization",
      rates_snapshot: [
        { id: 3, key: 'bopp_film_rate', value: 115.00 },
        { id: 2, key: 'adhesive_rate', value: 85.00 },
        { id: 12, key: 'packing_cost', value: 55.00 },
        { id: 13, key: 'profit', value: 8.00 },
      ]
    }
];


async function ensureDataDirExists() {
    try {
        await fs.access(DATA_DIR);
    } catch (error: any) { 
        if (error.code === 'ENOENT') { // Directory does not exist
            await fs.mkdir(DATA_DIR, { recursive: true });
            console.log(`Created data directory at ${DATA_DIR}`);
        } else {
            throw error; // Other errors
        }
    }
}

async function loadRatesFromFile(): Promise<BoppRate[]> {
    await ensureDataDirExists();
    try {
        const fileContent = await fs.readFile(RATES_FILE_PATH, 'utf-8');
        const ratesFromFile = JSON.parse(fileContent);
        
        const finalRatesMap = new Map<string, BoppRate>();

        // Add all initial default rates to the map first, ensuring they have IDs
        let maxId = 0;
        initialDefaultRates.forEach(defaultRate => {
            if (defaultRate.id && defaultRate.id > maxId) maxId = defaultRate.id;
        });
        initialDefaultRates.forEach(defaultRate => {
            if (!defaultRate.id) defaultRate.id = ++maxId;
            finalRatesMap.set(defaultRate.key, { ...defaultRate });
        });
        
        // Override with rates from file, or add new rates from file
        ratesFromFile.forEach((rateFromFile: BoppRate) => {
            if (!rateFromFile.id) rateFromFile.id = ++maxId; // Assign ID if missing
            else if (rateFromFile.id > maxId) maxId = rateFromFile.id;
            finalRatesMap.set(rateFromFile.key, { ...finalRatesMap.get(rateFromFile.key), ...rateFromFile });
        });

        return Array.from(finalRatesMap.values());

    } catch (error: any) {
        if (error.code === 'ENOENT') { // File doesn't exist
            console.log(`Rates file not found. Initializing with defaults and saving to ${RATES_FILE_PATH}`);
            let maxId = 0;
            const defaultRatesWithIds = initialDefaultRates.map(rate => {
                if (rate.id && rate.id > maxId) maxId = rate.id;
                return rate;
            });
            const finalDefaultRates = defaultRatesWithIds.map(rate => {
                if (!rate.id) return {...rate, id: ++maxId};
                return rate;
            });

            await fs.writeFile(RATES_FILE_PATH, JSON.stringify(finalDefaultRates, null, 2));
            return finalDefaultRates;
        }
        console.error(`Error reading rates file (${RATES_FILE_PATH}), returning defaults:`, error);
        // Fallback to in-memory defaults on other errors, ensuring IDs
        let maxId = 0;
        const defaultRatesWithIds = initialDefaultRates.map(rate => {
            if (rate.id && rate.id > maxId) maxId = rate.id;
            return rate;
        });
        return defaultRatesWithIds.map(rate => {
            if (!rate.id) return {...rate, id: ++maxId};
            return rate;
        });
    }
}

async function saveRatesToFile(rates: BoppRate[]) {
    await ensureDataDirExists();
    await fs.writeFile(RATES_FILE_PATH, JSON.stringify(rates, null, 2));
}

async function loadHistoryFromFile(): Promise<BoppRateHistory[]> {
    await ensureDataDirExists();
    try {
        const fileContent = await fs.readFile(HISTORY_FILE_PATH, 'utf-8');
        const history = JSON.parse(fileContent);
        return history.map((entry: any) => ({
            ...entry,
            changed_at: new Date(entry.changed_at),
            rates_snapshot: Array.isArray(entry.rates_snapshot) ? entry.rates_snapshot.map((r: any) => ({
                id: r.id, 
                key: r.key, 
                value: parseFloat(r.value)
            })) : [] 
        }));
    } catch (error: any) {
         if (error.code === 'ENOENT') { 
            console.log(`History file not found. Initializing with defaults and saving to ${HISTORY_FILE_PATH}`);
            const defaultHistoryCopy = JSON.parse(JSON.stringify(initialMockRateHistory)).map((entry: any) => ({
                ...entry,
                changed_at: new Date(entry.changed_at)
            }));
            await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(defaultHistoryCopy, null, 2));
            return defaultHistoryCopy;
        }
        console.error(`Error reading history file (${HISTORY_FILE_PATH}), returning defaults:`, error);
        return JSON.parse(JSON.stringify(initialMockRateHistory)).map((entry: any) => ({ 
            ...entry,
            changed_at: new Date(entry.changed_at)
        }));
    }
}

async function saveHistoryToFile(history: BoppRateHistory[]) {
    await ensureDataDirExists();
    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(history, null, 2));
}

export async function getBoppRates(): Promise<BoppRate[]> {
  console.log("Fetching BOPP rates (from file)...");
  return await loadRatesFromFile();
}

export async function updateBoppRates(newRatesFromForm: BoppRate[], userId: string, userName: string): Promise<void> {
  console.log(`Updating BOPP rates by ${userName} (to file)...`);

  const currentRatesInFile = await loadRatesFromFile(); 
  let history = await loadHistoryFromFile();
  
  const newHistoryId = history.length > 0 ? Math.max(0, ...history.map(h => h.id || 0)) + 1 : 1;

  const snapshotForHistory = JSON.parse(JSON.stringify(currentRatesInFile));

  history.unshift({ 
      id: newHistoryId,
      changed_at: new Date(),
      changed_by_id: userId,
      changed_by_name: userName,
      rates_snapshot: snapshotForHistory 
  });
  
  const updatedRatesForFileMap = new Map<string, BoppRate>();
  currentRatesInFile.forEach(rate => updatedRatesForFileMap.set(rate.key, {...rate}));

  let maxCurrentId = currentRatesInFile.reduce((max, rate) => Math.max(max, rate.id || 0), 0);

  newRatesFromForm.forEach(formRate => {
      const existingRate = updatedRatesForFileMap.get(formRate.key);
      if (existingRate) {
          updatedRatesForFileMap.set(formRate.key, {...existingRate, value: formRate.value});
      } else {
          updatedRatesForFileMap.set(formRate.key, {
              id: formRate.id || ++maxCurrentId, // Use formRate.id if present, else generate
              key: formRate.key,
              value: formRate.value
          });
      }
  });
  
  const finalUpdatedRates = Array.from(updatedRatesForFileMap.values());

  await saveRatesToFile(finalUpdatedRates);
  await saveHistoryToFile(history.slice(0, 50)); // Keep history to a reasonable size e.g. last 50 changes
  console.log("Rates and history updated in files.");
}

export async function getRateHistory(limit: number = 5): Promise<BoppRateHistory[]> {
  console.log(`Fetching last ${limit} rate histories (from file)...`);
  const history = await loadHistoryFromFile();
  return history.slice(0, limit);
}

