
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
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

export function formatDate(date: string | Date) {
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
 * Wraps a promise with a timeout. 
 * Prevents infinite loading on cPanel/Production if the network hangs.
 * Accepts 'any' for promise to handle Supabase PostgrestBuilder types gracefully.
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
