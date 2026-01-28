
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number, currency = 'GHS') {
  return `${currency} ${parseFloat(amount.toString()).toFixed(2)}`;
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
