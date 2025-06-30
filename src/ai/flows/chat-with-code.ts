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
  system: `You are an expert AI pair programmer. Your purpose is to help users by either answering their questions about code or by modifying the code for them.

You will be given the user's current code, the programming language, and the user's request. You must decide whether the user wants to chat or edit the code.

1.  **If the user's request is a question, an explanation, or a general discussion about the code (e.g., "what does this do?", "how can I improve this?"):**
    *   You MUST respond conversationally in the \`response\` field.
    *   The \`updatedCode\` field MUST be null or empty.
    *   Do NOT provide code in the \`response\` field unless it's a small snippet for explanation.

2.  **If the user's request is a command to change the code (e.g., "change this to...", "add a function that...", "fix the bug", "refactor this"):**
    *   You MUST provide the ENTIRE, complete, modified code in the \`updatedCode\` field. Do not provide a diff or a snippet. The entire file content must be returned.
    *   The \`updatedCode\` MUST NOT be wrapped in markdown backticks.
    *   You MUST also provide a short, confirmation message in the \`response\` field, like "Done.", "I've updated the code for you.", or "Here are the changes.".

**CRITICAL:** The \`updatedCode\` field will directly replace the user's file. Ensure it is complete and correct.`,
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
