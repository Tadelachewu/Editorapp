"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { ProjectFile } from '@/lib/types';
import { Save, Play } from 'lucide-react';

interface CodeEditorProps {
  file: ProjectFile | undefined;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onRun: () => void;
}

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
        <Textarea
          value={content}
          onChange={e => onContentChange(e.target.value)}
          placeholder="Type your code here..."
          className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 font-code text-base"
        />
      </CardContent>
    </Card>
  );
}
