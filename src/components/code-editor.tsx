"use client";

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProjectItem, Language } from '@/lib/types';
import { Save, Play } from 'lucide-react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { generateCodeSuggestions } from '@/ai/flows/generate-code-suggestions';
import type * as monaco from 'monaco-editor';

interface CodeEditorProps {
  file: ProjectItem | undefined;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onRun: () => void;
}

const languageMap: Record<Language, string> = {
  'C++': 'cpp',
  'React Native': 'javascript',
  'Python': 'python',
  'JavaScript': 'javascript',
  'Java': 'java',
  'Go': 'go',
};

export function CodeEditor({ file, content, onContentChange, onSave, onRun }: CodeEditorProps) {
  const monacoInstance = useMonaco();

  useEffect(() => {
    if (!monacoInstance || !file || file.itemType !== 'file' || !file.language || !file.fileType) return;

    const monacoLanguage = languageMap[file.language] || 'plaintext';

    const provider = monacoInstance.languages.registerCompletionItemProvider(monacoLanguage, {
      provideCompletionItems: async (model, position) => {
        const code = model.getValue();
        
        try {
          const result = await generateCodeSuggestions({
            codeSnippet: code,
            fileType: file.fileType!,
          });

          if (result && result.suggestions) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const suggestions = result.suggestions.map((suggestionText): monaco.languages.CompletionItem => ({
              label: suggestionText,
              kind: monacoInstance.languages.CompletionItemKind.Snippet,
              insertText: suggestionText,
              documentation: "AI-powered suggestion",
              range: range,
            }));
            return { suggestions };
          }
        } catch (error) {
          console.error('Error fetching AI suggestions:', error);
        }

        return { suggestions: [] };
      },
    });

    return () => {
      provider.dispose();
    };
  }, [monacoInstance, file]);

  if (!file || file.itemType !== 'file') {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p>Select a file to start editing.</p>
        </CardContent>
      </Card>
    );
  }

  const monacoLanguage = file.language ? languageMap[file.language] : 'plaintext';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{file.name}</CardTitle>
          <CardDescription>Language: {file.language}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={onRun} size="sm" variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Run
            </Button>
            <Button onClick={onSave} size="sm">
                <Save className="mr-2 h-4 w-4" />
                Save
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
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
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
