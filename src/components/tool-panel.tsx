"use client";

import { useState } from 'react';
import { Bot, History, ShieldAlert, Loader2, Terminal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { generateCodeImprovements } from '@/ai/flows/generate-code-improvements';
import type { ProjectFile, DbVersion } from '@/lib/types';

interface ToolPanelProps {
  file: ProjectFile | undefined;
  content: string;
  history: DbVersion[];
  onRevert: (versionId: number) => void;
  isExecuting: boolean;
  executionOutput: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ToolPanel({ file, content, history, onRevert, isExecuting, executionOutput, activeTab, onTabChange }: ToolPanelProps) {
  const [improvements, setImprovements] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateImprovements = async () => {
    if (!file) return;
    setIsLoading(true);
    setImprovements('');
    try {
      const result = await generateCodeImprovements({ code: content, language: file.language });
      setImprovements(result.improvements);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate improvements." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) {
    return (
        <Card className="h-full flex items-center justify-center">
            <CardContent>
                <p>Select a file to see available tools.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Tools</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0 min-h-0">
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="output"><Terminal className="w-4 h-4 mr-1" /> Output</TabsTrigger>
            <TabsTrigger value="improvements"><Bot className="w-4 h-4 mr-1" /> AI Improvements</TabsTrigger>
            <TabsTrigger value="diagnostics"><ShieldAlert className="w-4 h-4 mr-1" /> Diagnostics</TabsTrigger>
            <TabsTrigger value="history"><History className="w-4 h-4 mr-1" /> History</TabsTrigger>
          </TabsList>
          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="output">
              {isExecuting ? (
                <div className="flex items-center text-sm text-muted-foreground p-4">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing code...
                </div>
              ) : executionOutput ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Execution Output</h3>
                  <pre className="whitespace-pre-wrap rounded-md bg-secondary p-4 font-code text-sm">
                    {executionOutput}
                  </pre>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground p-4">
                  <p>
                    Click the "Run" button in the editor to execute the code and
                    see the output here.
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="improvements">
              <Button onClick={handleGenerateImprovements} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                Analyze Code for Improvements
              </Button>
              {isLoading && !improvements && <p className="mt-4 text-sm text-muted-foreground">Generating...</p>}
              {improvements && <pre className="mt-4 whitespace-pre-wrap rounded-md bg-secondary p-4 font-code text-sm">{improvements}</pre>}
            </TabsContent>
            <TabsContent value="diagnostics">
                <p className="text-sm text-muted-foreground mb-4">Real-time error checking and warnings. Uses AI to find improvements.</p>
                 <Button onClick={handleGenerateImprovements} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                    Run Diagnostics
                </Button>
                {isLoading && !improvements && <p className="mt-4 text-sm text-muted-foreground">Running diagnostics...</p>}
                {improvements && <pre className="mt-4 whitespace-pre-wrap rounded-md bg-secondary p-4 font-code text-sm">{improvements}</pre>}
            </TabsContent>
            <TabsContent value="history">
              {history.length > 0 ? (
                <ul className="space-y-2">
                  {history.map(v => (
                    <li key={v.vid} className="flex items-center justify-between rounded-md border p-2">
                      <div>
                        <p className="text-sm">Saved {formatDistanceToNow(v.timestamp, { addSuffix: true })}</p>
                        <p className="text-xs text-muted-foreground">{v.timestamp.toLocaleString()}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => onRevert(v.vid!)}>Revert</Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No version history for this file.</p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
