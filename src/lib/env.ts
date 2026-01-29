
import { z } from 'zod';

// Define the schema for your environment variables
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("Supabase URL must be a valid URL."),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required."),
  VITE_PAYSTACK_PUBLIC_KEY: z.string().min(1, "Paystack public key is required."),
});

// Parse and validate the environment variables from import.meta.env
const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  console.error(
    "🔥 Invalid environment variables:",
    parsedEnv.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables. Please check your .env file.");
}

// Export the validated and typed environment variables
export const env = parsedEnv.data;
