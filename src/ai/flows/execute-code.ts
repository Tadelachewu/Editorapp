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
  language: z
    .string()
    .describe(
      'The programming language of the code (e.g., C++, React Native, Python).'
    ),
  previousTranscript: z
    .string()
    .optional()
    .describe(
      'The existing transcript of the execution session, including any prior user input.'
    ),
  userInput: z
    .string()
    .optional()
    .describe('The new line of input from the user to the program.'),
});
export type ExecuteCodeInput = z.infer<typeof ExecuteCodeInputSchema>;

const ExecuteCodeOutputSchema = z.object({
  output: z
    .string()
    .describe("The program's output to stdout. This must include any newlines."),
  isWaitingForInput: z
    .boolean()
    .describe(
      'Set to true if the program has paused and is waiting for the user to provide stdin.'
    ),
  hasMoreOutput: z
    .boolean()
    .describe(
      'Set to true if the program has not finished executing (e.g., it is in a long loop) and more output is expected. Set to false if the program has terminated or is waiting for input.'
    ),
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
Your ONLY function is to simulate the provided code and respond with a JSON object matching the provided schema.
DO NOT add explanations or markdown. Your entire response must be the raw JSON object.

**CONTEXT**
- Language: {{{language}}}
- Code to simulate:
\\\`\\\`\\\`{{{language}}}
{{{code}}}
\\\`\\\`\\\`
{{#if previousTranscript}}
- Execution History (The program is already running. The last line may be new user input to process):
\\\`\\\`\\\`
{{{previousTranscript}}}
\\\`\\\`\\\`
{{/if}}

**TASK**
1.  Analyze the code and the execution history.
2.  Simulate the code's execution from where it last left off.
3.  Produce a JSON response that describes the *next* step of the execution.

**JSON OUTPUT RULES**
- **\\\`output\\\` (string):** The new text printed by the program in this step. MUST include newlines (\\\`\\\\n\\\`). For a simple \\\`print("hello")\\\`, this field MUST be \\\`"hello\\\\n"\\\`.
- **\\\`isWaitingForInput\\\` (boolean):** Set to \\\`true\\\` ONLY if the program has now PAUSED and is waiting for user input (e.g., after printing "Enter your name: ").
- **\\\`hasMoreOutput\\\` (boolean):**
    - Set to \\\`true\\\` if the program is in a long loop and has more to print.
    - Set to \\\`false\\\` if the program has finished OR if \\\`isWaitingForInput\\\` is \\\`true\\\`.`,
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
