import { z } from 'zod';

// Define the schema for environment variables
export const envSchema = z.object({
    // Server configuration
    WEBPORT: z.string().default('40222'),
    DNSPORT: z.string().default('53'),

    // Logging
    LOGGDIR: z.string().default('/data/logs'),
    LOGRETENTIONDAYS: z.string().default('7'),

    // Fallback
    USEHTTP: z.string().default('false'),
});

// Define the type from the schema
export type Env = z.infer<typeof envSchema>;

// Declare global ProcessEnv interface extension
declare global {
    namespace NodeJS {
        interface ProcessEnv extends Env {}
    }
}