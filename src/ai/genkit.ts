import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {ollama} from 'genkitx-ollama';

const useOllama = process.env.OLLAMA_ENABLED === 'true';

export const ai = genkit(
  useOllama
    ? // Ollama Configuration
      {
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
      }
    : // Google AI (Gemini) Configuration
      {
        plugins: [googleAI({apiKey: process.env.GOOGLE_API_KEY})],
        model: 'googleai/gemini-1.5-flash-latest',
      }
);