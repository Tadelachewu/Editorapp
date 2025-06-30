'use server';

/**
 * @fileOverview This file defines a Genkit flow for executing code and generating output.
 *
 * - executeCode - A function that takes code and language, and returns the simulated output.
 * - ExecuteCodeInput - The input type for the executeCode function.
 * - ExecuteCodeOutput - The return type for the executeCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExecuteCodeInputSchema = z.object({
  code: z.string().describe('The code block to be executed.'),
  language: z.string().describe('The programming language of the code (C++ or React Native).'),
});
export type ExecuteCodeInput = z.infer<typeof ExecuteCodeInputSchema>;

const ExecuteCodeOutputSchema = z.object({
  output: z.string().describe('The simulated output of the code execution.'),
});
export type ExecuteCodeOutput = z.infer<typeof ExecuteCodeOutputSchema>;

export async function executeCode(
  input: ExecuteCodeInput
): Promise<ExecuteCodeOutput> {
  return executeCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'executeCodePrompt',
  input: {schema: ExecuteCodeInputSchema},
  output: {schema: ExecuteCodeOutputSchema},
  prompt: `You are a code execution simulator.
You will be given a block of code and its programming language.
Your task is to simulate the execution of this code and provide the output it would generate.

- For C++, provide the standard console output.
- For React Native, describe the UI that would be rendered in a textual format. Do not provide code, just a description of the visual elements.

Programming Language: {{{language}}}

Code:
\`\`\`
{{{code}}}
\`\`\`

Simulated Output:`,
});

const executeCodeFlow = ai.defineFlow(
  {
    name: 'executeCodeFlow',
    inputSchema: ExecuteCodeInputSchema,
    outputSchema: ExecuteCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
