import { env } from 'cloudflare:workers';
export function database(){if(!env.DB)throw new Error('Saved audit history is temporarily unavailable.');return env.DB;}
