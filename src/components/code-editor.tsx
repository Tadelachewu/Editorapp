"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProjectFile, Language } from '@/lib/types';
import { Save, Play } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  file: ProjectFile | undefined;
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
  if (!file) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p>Select a file to start editing.</p>
        </CardContent>
      </Card>
    );
  }

  const monacoLanguage = languageMap[file.language] || 'plaintext';

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
          }}
        />
      </CardContent>
    </Card>
  );
}
