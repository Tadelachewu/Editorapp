'use server';

/**
 * @fileOverview This file defines a Genkit flow for an AI coding agent.
 *
 * - chatWithCode - A function that takes the current code, language, and a user message, and returns an AI response.
 * - ChatWithCodeInput - The input type for the chatWithCode function.
 * - ChatWithCodeOutput - The return type for the chatWithCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithCodeInputSchema = z.object({
  code: z.string().describe('The code the user is currently editing.'),
  language: z.string().describe('The programming language of the code.'),
  message: z.string().describe('The user\'s message or question to the AI agent.'),
});
export type ChatWithCodeInput = z.infer<typeof ChatWithCodeInputSchema>;

const ChatWithCodeOutputSchema = z.object({
  response: z.string().describe("The AI agent's textual response to the user's message."),
  updatedCode: z.string().optional().describe("If the user's request implies a code change, provide the full, updated code here. The user's editor will be updated with this content.")
});
export type ChatWithCodeOutput = z.infer<typeof ChatWithCodeOutputSchema>;

export async function chatWithCode(
  input: ChatWithCodeInput
): Promise<ChatWithCodeOutput> {
  return chatWithCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithCodePrompt',
  input: {schema: ChatWithCodeInputSchema},
  output: {schema: ChatWithCodeOutputSchema},
  system: `You are an AI assistant that can either chat with the user about their code or modify it.

- If the user's message is a question or a request for explanation, provide a helpful answer in the 'response' field. Leave the 'updatedCode' field empty.
- If the user's message is a request to change, add, fix, or write code, you MUST return the complete, updated code in the 'updatedCode' field. Also provide a short confirmation message in the 'response' field (e.g., "I've refactored the function as you requested.").
- It is critical that 'updatedCode' contains the full and correct file content, as it will directly replace the user's editor. Do not use markdown for the code.`,
  prompt: `The user is working on a file with the language "{{{language}}}".

Here is the current code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`

The user's request is:
"{{{message}}}"`,
});

const chatWithCodeFlow = ai.defineFlow(
  {
    name: 'chatWithCodeFlow',
    inputSchema: ChatWithCodeInputSchema,
    outputSchema: ChatWithCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
