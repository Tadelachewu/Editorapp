import { config } from 'dotenv';
config();

import '@/ai/flows/generate-code-suggestions.ts';
import '@/ai/flows/generate-code-improvements.ts';
import '@/ai/flows/execute-code.ts';
