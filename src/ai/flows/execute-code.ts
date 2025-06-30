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
  previousTranscript: z.string().optional().describe('The existing transcript of the execution session.'),
  userInput: z.string().optional().describe("The new line of input from the user to the program."),
});
export type ExecuteCodeInput = z.infer<typeof ExecuteCodeInputSchema>;

const ExecuteCodeOutputSchema = z.object({
  output: z.string().describe('The simulated output of the code execution.'),
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
  prompt: `You are a code execution simulator that perfectly mimics a standard input/output terminal.

{{#if userInput}}
You will be given a block of code, the previous terminal transcript, and a new line of user input.
Your task is to continue the simulation as if the user just typed their input and pressed Enter.

**Instructions:**
- Your response MUST be ONLY the new output the program would print to the console (stdout).
- DO NOT repeat or "echo" the user's input in your response. The terminal already displays it.
- If the program waits for the next input without printing anything, provide an empty response.
- If the program prints a newline, include it.

**Previous Transcript:**
\`\`\`
{{{previousTranscript}}}
\`\`\`

**User Input (stdin):**
\`\`\`
{{{userInput}}}
\`\`\`

**New Program Output (stdout):**
{{else}}
Your task is to simulate the initial execution of this code and provide the output it would generate.

- For languages that produce console output (like C++, Python, JavaScript, Java, Go, etc.), provide the standard console output. If the program expects user input, stop and wait for it. Your output should end right before the user would type. For example, end with "Enter your name: " and not "Enter your name: John".
- For UI languages like React Native, describe the UI that would be rendered in a textual format. Do not provide code, just a description of the visual elements.
- For server applications (like Node.js or a web server in another language), simulate the server starting up. Provide the console output, and then describe how a user could interact with it (e.g., "You could now open a browser and navigate to http://... to see the 'Hello, World!' response.").

Programming Language: {{{language}}}

Code:
\`\`\`
{{{code}}}
\`\`\`

Simulated Output:
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
