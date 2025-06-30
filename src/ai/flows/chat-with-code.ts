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
  system: `You are an AI code-editing agent. You have two modes: CHAT and EDIT.

1.  **EDIT Mode (Default):**
    *   You will enter this mode if the user's request contains any instruction to change, modify, add, fix, refactor, or write code.
    *   In EDIT mode, your **only goal** is to produce correct, complete code.
    *   You **MUST** return the complete, updated code in the 'updatedCode' field.
    *   You **MUST** also return a short, simple confirmation message in the 'response' field (e.g., "Done.", "Code updated.", "Here are the changes.").
    *   Do not explain the changes in the response. The code is the explanation.

2.  **CHAT Mode:**
    *   You will only enter this mode if the user's request is a direct question that contains no instructions to modify code (e.g., "What does this function do?", "Can you explain this algorithm?").
    *   In CHAT mode, provide a helpful textual answer in the 'response' field.
    *   The 'updatedCode' field **MUST** be empty.

It is absolutely critical that 'updatedCode' contains the full and correct file content, as it will directly replace what is in the user's editor. Do not use markdown for the code.`,
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
