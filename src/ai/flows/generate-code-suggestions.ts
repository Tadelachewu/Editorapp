'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating code completion suggestions.
 *
 * - generateCodeSuggestions - A function that generates code completion suggestions.
 * - CodeCompletionInput - The input type for the generateCodeSuggestions function.
 * - CodeCompletionOutput - The return type for the generateCodeSuggestions function.
 */

import { googleAiInstance, ollamaAiInstance } from '@/ai/genkit';
import { z, type Genkit } from 'genkit';

const CodeCompletionInputSchema = z.object({
  codeSnippet: z.string().describe('The current code snippet the user is working on.'),
  fileType: z.enum(['cpp', 'rn', 'py', 'js', 'java', 'go', 'html']).describe('The file type of the code snippet (cpp for C++, rn for React Native, py for Python, js for JavaScript, java for Java, go for Go, html for Web).'),
});
export type CodeCompletionInput = z.infer<typeof CodeCompletionInputSchema>;

const CodeCompletionOutputSchema = z.object({
  suggestion: z.string().describe('A single code completion suggestion to complete the current line or block.'),
});
export type CodeCompletionOutput = z.infer<typeof CodeCompletionOutputSchema>;

const createCodeSuggestionsFlow = (ai: Genkit, provider: 'google' | 'ollama') => {
    const prompt = ai.definePrompt({
        name: `codeCompletionPrompt_${provider}`,
        input: {schema: CodeCompletionInputSchema},
        output: {schema: CodeCompletionOutputSchema},
        prompt: `You are an AI code assistant that provides a single, high-quality code completion suggestion.

        Based on the given code snippet and file type, provide a single code completion suggestion.
        The suggestion should complete the current line or block of code.
        Do not repeat the existing code in your suggestion. Only provide the new code to be added.

        Code Snippet:
        {{{codeSnippet}}}

        File Type:
        {{fileType}}

        Suggestion:`,
    });

    return ai.defineFlow(
        {
            name: `generateCodeSuggestionsFlow_${provider}`,
            inputSchema: CodeCompletionInputSchema,
            outputSchema: CodeCompletionOutputSchema,
        },
        async input => {
            const {output} = await prompt(input);
            return output!;
        }
    );
}

const googleCodeSuggestionsFlow = createCodeSuggestionsFlow(googleAiInstance, 'google');
const ollamaCodeSuggestionsFlow = createCodeSuggestionsFlow(ollamaAiInstance, 'ollama');


export async function generateCodeSuggestions(
    input: CodeCompletionInput,
    options: { useOllama: boolean }
): Promise<CodeCompletionOutput> {
    if (options.useOllama) {
        try {
            const response = await fetch('http://127.0.0.1:11434', { signal: AbortSignal.timeout(1000) });
            if (!response.ok) throw new Error('Ollama server not running');
            return await ollamaCodeSuggestionsFlow(input);
        } catch (e) {
            // Fail silently for inline suggestions
            console.error("Ollama not available for code suggestion.", e);
            return { suggestion: '' };
        }
    }
    return googleCodeSuggestionsFlow(input);
}
