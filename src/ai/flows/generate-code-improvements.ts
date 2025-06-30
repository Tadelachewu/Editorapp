'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating code improvement suggestions.
 *
 * - generateCodeImprovements - A function that takes code and a programming language as input and returns improvement suggestions.
 * - CodeImprovementInput - The input type for the generateCodeImprovements function.
 * - CodeImprovementOutput - The return type for the generateCodeImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeImprovementInputSchema = z.object({
  code: z.string().describe('The code block to be improved.'),
  language: z.string().describe('The programming language of the code.'),
});
export type CodeImprovementInput = z.infer<typeof CodeImprovementInputSchema>;

const CodeImprovementOutputSchema = z.object({
  improvements: z.string().describe('The AI-generated suggestions for improving the code.'),
});
export type CodeImprovementOutput = z.infer<typeof CodeImprovementOutputSchema>;

export async function generateCodeImprovements(
  input: CodeImprovementInput
): Promise<CodeImprovementOutput> {
  return generateCodeImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'codeImprovementPrompt',
  input: {schema: CodeImprovementInputSchema},
  output: {schema: CodeImprovementOutputSchema},
  prompt: `You are an AI code assistant that suggests improvements to the given code.

      Provide clear and concise suggestions for improving the code quality, readability, and performance.
      Consider best practices, common pitfalls, and alternative approaches.

      Programming Language: {{{language}}}

      Code:
      \`\`\`
      {{{code}}}
      \`\`\`

      Improvements:`,
});

const generateCodeImprovementsFlow = ai.defineFlow(
  {
    name: 'generateCodeImprovementsFlow',
    inputSchema: CodeImprovementInputSchema,
    outputSchema: CodeImprovementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
