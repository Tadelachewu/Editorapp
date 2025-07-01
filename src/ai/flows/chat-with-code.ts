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

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant']).describe("The role of the message sender, either 'user' or 'assistant'."),
    content: z.string().describe("The content of the message.")
});

const ChatWithCodeInputSchema = z.object({
  code: z.string().describe('The code the user is currently editing.'),
  language: z.string().describe('The programming language of the code.'),
  message: z.string().describe("The user's message or question to the AI agent."),
  history: z.array(ChatMessageSchema).optional().describe("The history of the conversation so far."),
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
  system: `You are an expert AI programming assistant.
Your purpose is to help the user with the provided code based on their request.
You have two modes of operation: "Chat" and "Edit".

1.  **Chat Mode**:
    *   **When to use**: If the user asks a question, wants an explanation, or requests feedback.
    *   **Action**: Provide a helpful, clear explanation in the 'response' field. DO NOT provide code in the 'updatedCode' field.
    *   **Example**: User says "explain this function". You respond in the 'response' field.

2.  **Edit Mode**:
    *   **When to use**: If the user explicitly asks for a code change, refactoring, addition, or deletion.
    *   **Action**:
        1.  Generate the complete, updated code and place it in the 'updatedCode' field.
        2.  Provide a short confirmation message (e.g., "Done. I've updated the code.") in the 'response' field.
    *   **Example**: User says "add a button". You provide the full new code in 'updatedCode' and a confirmation in 'response'.

**CRITICAL RULES**:
*   NEVER use markdown backticks (\\\`\\\`\\\`) in the 'updatedCode' field.
*   ALWAYS return the *entire file content* in 'updatedCode', not just a snippet.
*   Your response directly updates the user's editor. Follow these instructions carefully.
*   Consider the conversation history for context.`,
  prompt: `The user is working on a file with the language "{{{language}}}".

{{#if history}}
Here is the conversation history for context:
{{#each history}}
{{this.role}}: {{{this.content}}}
{{/each}}
{{/if}}

Here is the current code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`

The user's latest request is:
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
