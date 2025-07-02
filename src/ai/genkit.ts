'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {ollama} from 'genkitx-ollama';

/**
 * Genkit instance configured for Google AI (Gemini).
 */
export const googleAiInstance = genkit({
  plugins: [googleAI({apiKey: process.env.GOOGLE_API_KEY})],
  model: 'googleai/gemini-1.5-flash-latest',
});

/**
 * Genkit instance configured for Ollama.
 */
export const ollamaAiInstance = genkit({
  plugins: [
    ollama({
      models: [
        {
          name: 'llama3',
          type: 'generate',
        },
        {
          name: 'gemma',
          type: 'generate',
        },
      ],
      serverAddress: 'http://127.0.0.1:11434',
    }),
  ],
  model: 'ollama/llama3',
});
