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
      'The existing transcript of the execution session, including all prior stdout and stdin.'
    ),
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
  prompt: `You are a master-level code execution simulator. Your function is to perfectly mimic how a real computer terminal would execute the provided code. You will receive the code, the language, and the history of the execution so far in the transcript. You must determine the *next* piece of output the program generates and whether it's waiting for user input.

Your response MUST be a raw JSON object and nothing else.

**CONTEXT**
- Language: {{{language}}}
- Code to simulate:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`
{{#if previousTranscript}}
- Execution Transcript: This is the complete history of stdout and stdin so far. The program state should be determined from this. If the program was waiting for input, the last line of the transcript is the user's typed input.
\`\`\`
{{{previousTranscript}}}
\`\`\`
{{/if}}

**TASK**
1.  Analyze the code and the current state based on the \`Execution Transcript\`.
2.  Simulate the code's execution, starting from where it last left off.
3.  Your simulation MUST STOP at the very next point the program waits for user input (e.g., an \`input()\` call) or when the program terminates.
4.  Produce a JSON response describing the result of this simulation step.

**RULES FOR SIMULATION & JSON OUTPUT**
-   **\`output\` (string):** This field must contain the *exact* text the program prints to standard output in this step.
    -   Python's \`print("hello")\` produces \`"hello\\n"\`.
    -   Python's \`input("Name: ")\` produces \`"Name: "\`. The prompt text does NOT have a newline.
    -   Combine all consecutive print/output calls into a single \`output\` string before the program waits for input or finishes.
-   **\`isWaitingForInput\` (boolean):**
    -   Set to \`true\` ONLY if the program has now PAUSED and is waiting for the user to provide stdin.
    -   If \`true\`, the \`output\` field should contain any text that was printed *before* the program started waiting (e.g., the input prompt itself).
-   **\`hasMoreOutput\` (boolean):**
    -   Set to \`true\` if the program is in a long loop and has more to print *without* needing more user input.
    -   Set to \`false\` if the program has finished OR if \`isWaitingForInput\` is \`true\`.

**EXAMPLE SESSION (Python)**
-   Code: \`name = input("Enter name: ")\\nprint(f"Hello, {name}")\`
-   **Step 1 (Initial Run):**
    -   Your Input: \`previousTranscript: ""\`
    -   Your JSON Output: \`{ "output": "Enter name: ", "isWaitingForInput": true, "hasMoreOutput": false }\`
-   **Step 2 (User provides input "Alice"):**
    -   Your Input: \`previousTranscript: "Enter name: Alice\\n"\`
    -   Your JSON Output: \`{ "output": "Hello, Alice\\n", "isWaitingForInput": false, "hasMoreOutput": false }\``,
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
