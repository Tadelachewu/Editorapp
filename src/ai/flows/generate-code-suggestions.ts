'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating code completion suggestions.
 *
 * - generateCodeSuggestions - A function that generates code completion suggestions.
 * - CodeCompletionInput - The input type for the generateCodeSuggestions function.
 * - CodeCompletionOutput - The return type for the generateCodeSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeCompletionInputSchema = z.object({
  codeSnippet: z.string().describe('The current code snippet the user is working on.'),
  fileType: z.enum(['cpp', 'rn', 'py', 'js', 'java', 'go']).describe('The file type of the code snippet (cpp for C++, rn for React Native, py for Python, js for JavaScript, java for Java, go for Go).'),
});
export type CodeCompletionInput = z.infer<typeof CodeCompletionInputSchema>;

const CodeCompletionOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of code completion suggestions.'),
});
export type CodeCompletionOutput = z.infer<typeof CodeCompletionOutputSchema>;

export async function generateCodeSuggestions(input: CodeCompletionInput): Promise<CodeCompletionOutput> {
  return generateCodeSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'codeCompletionPrompt',
  input: {schema: CodeCompletionInputSchema},
  output: {schema: CodeCompletionOutputSchema},
  prompt: `You are an AI code assistant that suggests code completions.

  Based on the given code snippet and file type, provide code completion suggestions.
  Ensure the suggestions are relevant to the code and file type (C++ or React Native).

  Code Snippet:
  {{codeSnippet}}

  File Type:
  {{fileType}}

  Suggestions (as an array of strings):`,
});

const generateCodeSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateCodeSuggestionsFlow',
    inputSchema: CodeCompletionInputSchema,
    outputSchema: CodeCompletionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
