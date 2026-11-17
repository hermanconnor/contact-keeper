import { z } from 'zod';

const envSchema = z.object({
  // Base URL of the API. The default goes through the Vite dev proxy (see vite.config.ts).
  VITE_API_URL: z.string().min(1).default('/api/v1'),
});

const parsed = envSchema.parse(import.meta.env);

export const env = {
  API_URL: parsed.VITE_API_URL.replace(/\/+$/, ''),
} as const;
