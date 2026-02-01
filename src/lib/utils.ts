
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string | undefined | null, currency = 'GHS') {
  if (amount === null || amount === undefined) return `${currency} 0.00`;
  
  let value: number;
  
  if (typeof amount === 'number') {
      value = amount;
  } else if (typeof amount === 'string') {
      value = parseFloat(amount);
  } else {
      // Fallback for objects/arrays/etc
      value = 0;
  }

  return `${currency} ${isNaN(value) ? '0.00' : value.toFixed(2)}`;
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return 'N/A';
  try {
      return new Date(date).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  } catch (e) {
      return 'Invalid Date';
  }
}

/**
 * Generates a readable SML ID from a UUID.
 * Format: SML-XXXXXXXX (First 8 chars of UUID uppercase)
 */
export function generateSmlId(uuid: string): string {
    if (!uuid) return 'SML-GUEST';
    return `SML-${uuid.substring(0, 8).toUpperCase()}`;
}

/**
 * Wraps a promise with a timeout. 
 * Prevents infinite loading on cPanel/Production if the network hangs.
 */
export async function withTimeout<T>(promise: any, ms: number = 15000, timeoutName: string = "Request"): Promise<T> {
    let timeoutId: any;
    
    // Create a timeout promise that rejects after ms
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            const err = new Error(`${timeoutName} timed out after ${ms/1000}s`);
            err.name = 'TimeoutError';
            reject(err);
        }, ms);
    });

    try {
        // Promise.resolve ensures we treat values/builders as promises
        const result = await Promise.race([Promise.resolve(promise), timeoutPromise]);
        return result as T;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Date Utils Merged
export const dateUtils = {
  formatDate(date: Date | string, includeTime = true): string {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return d.toLocaleDateString('en-US', options);
  },
  
  formatForInput(date: Date | string): string {
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },
  
  getMonthYearFromDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }
};
