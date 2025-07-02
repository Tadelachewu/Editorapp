
"use client";

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProjectItem, Language } from '@/lib/types';
import { Save, Play, Square, Eye } from 'lucide-react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { generateCodeSuggestions } from '@/ai/flows/generate-code-suggestions';
import type * as monaco from 'monaco-editor';

interface CodeEditorProps {
  file: ProjectItem | undefined;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onRun: () => void;
  isRunning: boolean;
  useOllama: boolean;
}

const languageMap: Record<Language, string> = {
  'C++': 'cpp',
  'React Native': 'javascript',
  'Python': 'python',
  'JavaScript': 'javascript',
  'Java': 'java',
  'Go': 'go',
  'Node.js': 'javascript',
  'Web': 'html',
};

export function CodeEditor({ file, content, onContentChange, onSave, onRun, isRunning, useOllama }: CodeEditorProps) {
  const monacoInstance = useMonaco();

  useEffect(() => {
    if (!monacoInstance || !file || file.itemType !== 'file' || !file.language || !file.fileType) return;

    const monacoLanguage = languageMap[file.language] || 'plaintext';

    const provider = monacoInstance.languages.registerInlineCompletionsProvider(monacoLanguage, {
      provideInlineCompletions: async (model, position) => {
        const code = model.getValue();
        
        try {
          const result = await generateCodeSuggestions({
            codeSnippet: code,
            fileType: file.fileType!,
          }, { useOllama });

          if (result && result.suggestion) {
            return {
              items: [
                {
                  insertText: result.suggestion,
                },
              ],
            };
          }
        } catch (error) {
          // Fail silently for inline suggestions, but log the error for debugging
          console.error('Error fetching AI suggestions:', error);
        }

        return { items: [] };
      },
      freeInlineCompletions: () => {},
    });

    return () => {
      provider.dispose();
    };
  }, [monacoInstance, file, useOllama]);

  if (!file || file.itemType !== 'file') {
    return (
      <Card className="h-full w-full flex items-center justify-center">
        <CardContent>
          <p>Select a file to start editing.</p>
        </CardContent>
      </Card>
    );
  }

  const monacoLanguage = file.language ? languageMap[file.language] : 'plaintext';
  const isWebApp = file.language === 'Web';

  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{file.name}</CardTitle>
          <CardDescription>Language: {file.language}</CardDescription>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
            {isWebApp ? (
              <Button onClick={onRun} size="sm" className="flex-1 sm:flex-initial">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            ) : (
              <Button onClick={onRun} size="sm" variant={isRunning ? "destructive" : "default"} className="flex-1 sm:flex-initial">
                {isRunning ? (
                  <><Square className="mr-2 h-4 w-4" /> Stop</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" /> Run</>
                )}
              </Button>
            )}
            <Button onClick={onSave} size="sm" className="flex-1 sm:flex-initial">
                <Save className="mr-2 h-4 w-4" />
                Save
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <Editor
          height="100%"
          language={monacoLanguage}
          value={content}
          onChange={(value) => onContentChange(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: '"Source Code Pro", monospace',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            inlineSuggest: { enabled: true },
          }}
        />
      </CardContent>
    </Card>
  );
}
