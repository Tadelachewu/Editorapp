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
  message: z.string().describe("The user's message or question to the AI agent."),
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
  system: `You are an AI assistant that helps users with their code. Analyze the user's request and the provided code.

**Instructions:**

1.  **Analyze Intent:** Determine if the user's request is a command to *modify* the code OR a question *about* the code.

2.  **Modification Request (e.g., "add a button", "fix this bug", "refactor this function"):**
    *   Generate the full, updated code.
    *   Place the complete code in the \`updatedCode\` field.
    *   Place a short confirmation message like "I've updated the code for you." in the \`response\` field.
    *   DO NOT wrap the code in the \`updatedCode\` field in markdown backticks.

3.  **Question/Explanation Request (e.g., "what does this do?", "how can I improve this?"):**
    *   Generate a helpful, conversational answer.
    *   Place the answer in the \`response\` field.
    *   Leave the \`updatedCode\` field null or empty.
    *   Do NOT put full code blocks in the \`response\` field. Use small snippets for examples if necessary.

You MUST follow these instructions. Your response will directly update the user's editor.`,
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
