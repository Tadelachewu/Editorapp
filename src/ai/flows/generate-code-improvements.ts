'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating code improvement suggestions.
 *
 * - generateCodeImprovements - A function that takes code and a programming language as input and returns improvement suggestions.
 * - CodeImprovementInput - The input type for the generateCodeImprovements function.
 * - CodeImprovementOutput - The return type for the generateCodeImprovements function.
 */

import { googleAiInstance, ollamaAiInstance } from '@/ai/genkit';
import { z, type Genkit } from 'genkit';

const CodeImprovementInputSchema = z.object({
  code: z.string().describe('The code block to be improved.'),
  language: z.string().describe('The programming language of the code.'),
});
export type CodeImprovementInput = z.infer<typeof CodeImprovementInputSchema>;

const CodeImprovementOutputSchema = z.object({
  suggestions: z.string().describe('A human-readable summary of the improvements made to the code.'),
  improvedCode: z.string().describe('The full, updated code with all improvements applied.'),
});
export type CodeImprovementOutput = z.infer<typeof CodeImprovementOutputSchema>;

const createCodeImprovementsFlow = (ai: Genkit, provider: 'google' | 'ollama') => {
    const prompt = ai.definePrompt({
        name: `codeImprovementPrompt_${provider}`,
        input: {schema: CodeImprovementInputSchema},
        output: {schema: CodeImprovementOutputSchema},
        prompt: `You are an expert AI code assistant. Your task is to improve and refactor the given code based on best practices for quality, readability, and performance.

You will produce a JSON object with two fields:
1.  \`improvedCode\`: The complete, refactored code. This should be a drop-in replacement for the original code.
2.  \`suggestions\`: A clear, concise, human-readable summary of the key improvements you made, formatted as a list or bullet points.

**CRITICAL INSTRUCTIONS**:
- Your response MUST be a valid JSON object.
- If you cannot find any improvements, you MUST still return a JSON object with both \`improvedCode\` and \`suggestions\` fields set to empty strings (""). DO NOT return an empty response or an error.
- The \`improvedCode\` field MUST contain the entire file content, not just a snippet.

**Programming Language:** {{{language}}}

**Original Code:**
\`\`\`{{{language}}}
{{{code}}}
\`\`\`

Now, generate the JSON response.`,
    });

    return ai.defineFlow(
        {
        name: `generateCodeImprovementsFlow_${provider}`,
        inputSchema: CodeImprovementInputSchema,
        outputSchema: CodeImprovementOutputSchema,
        },
        async input => {
        const {output} = await prompt(input);
        if (!output) {
            throw new Error('The AI model failed to return a valid response. Please try again.');
        }
        return output;
        }
    );
};

const googleCodeImprovementsFlow = createCodeImprovementsFlow(googleAiInstance, 'google');
const ollamaCodeImprovementsFlow = createCodeImprovementsFlow(ollamaAiInstance, 'ollama');

const ollamaHost = process.env.OLLAMA_HOST || '127.0.0.1';

export async function generateCodeImprovements(
  input: CodeImprovementInput,
  options: { useOllama: boolean }
): Promise<CodeImprovementOutput> {
  if (options.useOllama) {
    try {
      const response = await fetch(`http://${ollamaHost}:11434`);
      if (!response.ok) throw new Error('Ollama server not running');
      return await ollamaCodeImprovementsFlow(input);
    } catch (e) {
      console.error("Ollama not available.", e);
      throw new Error(`Ollama is enabled but the server is not reachable at http://${ollamaHost}:11434. Please start the Ollama server.`);
    }
  }
  return googleCodeImprovementsFlow(input);
}
