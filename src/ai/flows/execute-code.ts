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
  language: z.string().describe('The programming language of the code (e.g., C++, React Native, Python).'),
  previousTranscript: z.string().optional().describe('The existing transcript of the execution session, including any prior user input.'),
  userInput: z.string().optional().describe("The new line of input from the user to the program."),
});
export type ExecuteCodeInput = z.infer<typeof ExecuteCodeInputSchema>;

const ExecuteCodeOutputSchema = z.object({
  output: z.string().describe("The program's output to stdout."),
  isWaitingForInput: z.boolean().describe('Set to true if the program has paused and is waiting for the user to provide stdin.'),
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
  prompt: `You are a code execution simulator that perfectly mimics a standard interactive terminal. Your response MUST be in JSON format matching the provided schema.

{{#if userInput}}
You are given a block of code, the previous terminal transcript (which includes the user's latest input), and that same line of user input again for context.
Your task is to continue the simulation.

**Instructions:**
1.  Determine the new output the program would print to \`stdout\` after receiving the user's input.
2.  Set the \`output\` field in your JSON response to this new program output. DO NOT echo the user's input back, as it is already in the transcript.
3.  Determine if the program is now waiting for another line of user input.
4.  Set the \`isWaitingForInput\` field to \`true\` if it is waiting, and \`false\` if the program has terminated or is continuing without waiting.

**Current State**

Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`
Previous Transcript (includes the latest user input):
\`\`\`
{{{previousTranscript}}}
\`\`\`
User's Last Input (for context, do not repeat in output):
\`\`\`
{{{userInput}}}
\`\`\`

{{else}}
You are simulating the initial execution of a piece of code.

**Instructions:**
1.  Simulate the program's execution from the beginning.
2.  Set the \`output\` field in your JSON response to whatever the program prints to \`stdout\`.
3.  If the program runs to completion without requiring input, set \`isWaitingForInput\` to \`false\`.
4.  If the program stops to wait for user input (e.g., using \`cin\`, \`input()\`, etc.), the \`output\` field should contain everything printed *before* the program waits, and you MUST set \`isWaitingForInput\` to \`true\`.

**Example:** If the code is \`input("Enter name: ")\`, your JSON response should be \`{"output": "Enter name: ", "isWaitingForInput": true}\`.

**Code to Execute:**
\`\`\`{{{language}}}
{{{code}}}
\`\`\`
{{/if}}`,
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
