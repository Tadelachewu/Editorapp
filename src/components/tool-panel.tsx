
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Bot, History, Loader2, MessageSquare, User, Send, Terminal, Eye, Wand2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { generateCodeImprovements } from '@/ai/flows/generate-code-improvements';
import { chatWithCode, type ChatWithCodeOutput } from '@/ai/flows/chat-with-code';
import type { ProjectItem, DbVersion } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';
import { useIsMobile } from '@/hooks/use-mobile';


interface ToolPanelProps {
  file: ProjectItem | undefined;
  content: string;
  allItems: ProjectItem[];
  history: DbVersion[];
  onRevert: (versionId: number) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCodeUpdate: (newCode: string) => void;
  isExecuting: boolean;
  isWaitingForInput: boolean;
  executionTranscript: string;
  onExecuteInput: (input: string) => void;
  useOllama: boolean;
  // Lifted state
  chatMessages: { role: 'user' | 'assistant'; content: string }[];
  setChatMessages: React.Dispatch<React.SetStateAction<{ role: 'user' | 'assistant'; content: string }[]>>;
  isChatting: boolean;
  setIsChatting: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
}

export function ToolPanel({
  file,
  content,
  allItems,
  history,
  onRevert,
  activeTab,
  onTabChange,
  onCodeUpdate,
  isExecuting,
  isWaitingForInput,
  executionTranscript,
  onExecuteInput,
  useOllama,
  chatMessages,
  setChatMessages,
  isChatting,
  setIsChatting,
  onClose,
}: ToolPanelProps) {
  const [improvementResult, setImprovementResult] = useState<{ suggestions: string; improvedCode: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [chatInput, setChatInput] = useState('');
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const executionOutputRef = useRef<HTMLDivElement>(null);
  const [executionInput, setExecutionInput] = useState('');

  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const isWebApp = file?.language === 'Web';
  const isMobile = useIsMobile();

  useEffect(() => {
    let url: string | undefined;

    const generatePreview = async () => {
      if (activeTab !== 'preview' || !file || !isWebApp || !allItems.length) {
        return;
      }

      try {
        const parentId = file.parentId;
        let processedHtml = content;

        if (parentId) {
            const siblingFiles = allItems.filter(item => item.parentId === parentId && item.itemType === 'file' && item.id !== file.id);
            if (siblingFiles.length > 0) {
              const fileContents = await db.fileContents.bulkGet(siblingFiles.map(f => f.id));
              
              const fileContentMap = new Map<string, string>();
              siblingFiles.forEach((siblingFile, index) => {
                  if (fileContents && fileContents[index]) {
                      fileContentMap.set(siblingFile.name, fileContents[index]!.content);
                  }
              });

              // Inline CSS
              const cssRegex = /<link[^>]*?href=["'](?<href>.*?.css)["'][^>]*>/gi;
              for (const match of content.matchAll(cssRegex)) {
                  const cssFileName = match.groups?.href.replace('./', '');
                  if (cssFileName && fileContentMap.has(cssFileName)) {
                      const cssContent = fileContentMap.get(cssFileName);
                      processedHtml = processedHtml.replace(match[0], `<style>\n${cssContent}\n</style>`);
                  }
              }

              // Inline JS
              const jsRegex = /<script[^>]*?src=["'](?<src>.*?.js)["'][^>]*><\/script>/gi;
              for (const match of content.matchAll(jsRegex)) {
                  const jsFileName = match.groups?.src.replace('./', '');
                  if (jsFileName && fileContentMap.has(jsFileName)) {
                      const jsContent = fileContentMap.get(jsFileName);
                      processedHtml = processedHtml.replace(match[0], `<script>\n${jsContent}\n</script>`);
                  }
              }
            }
        }
        
        const blob = new Blob([processedHtml], { type: 'text/html' });
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);

      } catch(e) {
          console.error("Error generating web preview:", e);
          toast({ variant: 'destructive', title: 'Preview Error', description: 'Could not generate the web preview.' });
          const errorBlob = new Blob([`<h1>Preview Error</h1><p>${e}</p>`], { type: 'text/html' });
          url = URL.createObjectURL(errorBlob);
          setPreviewUrl(url);
      }
    };

    generatePreview();

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
        setPreviewUrl(undefined);
      }
    };
  }, [activeTab, file, content, allItems, isWebApp, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [chatMessages]);

  useEffect(() => {
    const viewport = executionOutputRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [executionTranscript, isExecuting]);

  const handleGenerateImprovements = async () => {
    if (!file || !file.language) return;
    setIsLoading(true);
    setImprovementResult(null);
    try {
      const result = await generateCodeImprovements({ code: content, language: file.language }, { useOllama });
      setImprovementResult(result);
    } catch (error) {
      console.error(error);
      const description = error instanceof Error ? error.message : "Failed to generate improvements.";
      toast({ variant: "destructive", title: "Error", description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyImprovements = () => {
    if (improvementResult?.improvedCode) {
      onCodeUpdate(improvementResult.improvedCode);
      toast({
        title: "Code Improved",
        description: "The suggestions have been applied to the editor.",
      });
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !file || !file.language || isChatting) return;

    const userMessage = { role: 'user' as const, content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatting(true);

    try {
      const result = await chatWithCode({
          code: content,
          language: file.language,
          message: currentInput,
          history: chatMessages,
        }, { useOllama });

      const assistantMessage = { role: 'assistant' as const, content: result.response };
      setChatMessages(prev => [...prev, assistantMessage]);

      if (result.updatedCode) {
        onCodeUpdate(result.updatedCode);
      }
    } catch (error) {
      console.error(error);
      
      const errorMessageContent = error instanceof Error ? error.message : "Sorry, I couldn't get a response. Please try again.";
      
      const errorMessage = { role: 'assistant' as const, content: errorMessageContent };
      setChatMessages(prev => [...prev, errorMessage]);
      
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to get response from AI agent." 
      });
    } finally {
      setIsChatting(false);
    }
  };

  const handleChatFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendChatMessage();
  };

  const handleExecutionInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWaitingForInput) return;
    onExecuteInput(executionInput);
    setExecutionInput('');
  };

  if (!file) {
    return (
        <Card className="h-full w-full flex items-center justify-center">
            <CardContent className="w-full">
                <p>Select a file to see available tools.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="h-full w-full flex flex-col min-h-0">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Tools</CardTitle>
        {!isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} title="Close panel">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0 min-h-0">
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-2 sm:flex sm:flex-wrap h-auto sm:h-auto">
            <TabsTrigger value="agent" className="flex-1 sm:flex-initial">
              <MessageSquare className="mr-2 h-4 w-4"/>
              Agent
            </TabsTrigger>
            {isWebApp ? (
              <TabsTrigger value="preview" className="flex-1 sm:flex-initial">
                <Eye className="mr-2 h-4 w-4"/>
                Preview
              </TabsTrigger>
            ) : (
              <TabsTrigger value="output" className="flex-1 sm:flex-initial">
                <Terminal className="mr-2 h-4 w-4"/>
                Output
              </TabsTrigger>
            )}
            <TabsTrigger value="improvements" className="flex-1 sm:flex-initial">
              <Bot className="mr-2 h-4 w-4"/>
              Improvements
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 sm:flex-initial">
              <History className="mr-2 h-4 w-4"/>
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="agent" className="flex-1 flex flex-col min-h-0 mt-2">
            <ScrollArea className="flex-1 -mx-6 px-6 py-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {chatMessages.length === 0 && !isChatting && (
                         <div className="text-center text-sm text-muted-foreground p-4">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                            <p className="font-semibold">Chat with the AI Agent</p>
                            <p className="text-xs">Ask to explain, improve, or refactor your code.</p>
                        </div>
                    )}
                    {chatMessages.map((message, index) => (
                      <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : '')}>
                        {message.role === 'assistant' && <div className="p-2 rounded-full bg-primary text-primary-foreground flex-shrink-0"><Bot className="w-4 h-4" /></div>}
                        <div className={cn(
                          "rounded-lg p-3 text-sm max-w-[85%]",
                          message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                        )}>
                          <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                        </div>
                        {message.role === 'user' && <div className="p-2 rounded-full bg-muted flex-shrink-0"><User className="w-4 h-4" /></div>}
                      </div>
                    ))}
                    {isChatting && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary text-primary-foreground flex-shrink-0"><Bot className="w-4 h-4" /></div>
                        <div className="rounded-lg p-3 text-sm bg-secondary flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Thinking...
                        </div>
                      </div>
                    )}
                </div>
            </ScrollArea>
            <form onSubmit={handleChatFormSubmit} className="flex items-center gap-2 pt-2 border-t mt-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="e.g., Explain this code to me..."
                  className="min-h-[40px] flex-1 resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isChatting) {
                        e.preventDefault();
                        handleSendChatMessage();
                    }
                  }}
                  disabled={isChatting}
                />
                <Button type="submit" disabled={isChatting || !chatInput.trim()} size="icon">
                  <Send className="w-4 h-4" />
                  <span className="sr-only">Send</span>
                </Button>
            </form>
          </TabsContent>

          {isWebApp ? (
            <TabsContent value="preview" className="flex-1 mt-2 min-h-0">
              <iframe
                key={previewUrl}
                src={previewUrl}
                title="Browser Preview"
                className="w-full h-full border-0 rounded-md bg-white"
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-popups-to-escape-sandbox"
              />
            </TabsContent>
          ) : (
            <TabsContent value="output" className="flex-1 flex flex-col min-h-0 mt-2">
              {executionTranscript === '' && !isExecuting ? (
                  <div className="text-center text-sm text-muted-foreground p-4 flex-1 flex flex-col items-center justify-center">
                      <p>Output from your code will appear here.</p>
                      <p className="text-xs">Click the "Run" button in the editor to start.</p>
                  </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <ScrollArea className="flex-1 bg-muted/20 rounded-md">
                      <pre className="p-4 font-mono text-sm whitespace-pre">
                          {executionTranscript}
                          {isExecuting && !isWaitingForInput && (
                              <div className="flex items-center text-muted-foreground mt-2">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  <span>Executing...</span>
                              </div>
                          )}
                      </pre>
                  </ScrollArea>
                  {isWaitingForInput && (
                      <form onSubmit={handleExecutionInputSubmit} className="flex-shrink-0 flex items-center gap-2 border-t mt-1 pt-1 bg-background font-mono text-sm">
                          <Input
                              value={executionInput}
                              onChange={(e) => setExecutionInput(e.target.value)}
                              className="flex-1 h-8"
                              placeholder="Type your input here..."
                              autoFocus
                              spellCheck="false"
                          />
                          <Button type="submit" size="icon" className="h-8 w-8">
                              <Send className="w-4 h-4" />
                              <span className="sr-only">Send Input</span>
                          </Button>
                      </form>
                  )}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="improvements" className="flex-1 mt-2 flex flex-col min-h-0">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <p className="mt-4 text-sm text-muted-foreground">Generating improvements...</p>
              </div>
            ) : improvementResult?.suggestions ? (
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 -mx-6 px-6">
                    <pre className="whitespace-pre p-4 font-code text-sm text-left">{improvementResult.suggestions}</pre>
                </ScrollArea>
                <div className="pt-2 border-t mt-2">
                  <Button onClick={handleApplyImprovements} className="w-full">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Apply Improvements
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <Bot className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-semibold mb-2">Code Improvements</p>
                <p className="text-sm text-muted-foreground mb-4">Analyze your code for suggestions on quality, readability, and performance.</p>
                <Button onClick={handleGenerateImprovements}>
                  Analyze Code
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="history" className="flex-1 flex flex-col min-h-0 mt-2">
            <ScrollArea className="flex-1 -mx-6 px-6 py-4">
                {history.length > 0 ? (
                  <ul className="space-y-2">
                    {history.map(v => (
                      <li key={v.vid} className="flex items-center justify-between rounded-md border p-2">
                        <div>
                          <p className="text-sm">Saved {formatDistanceToNow(v.timestamp, { addSuffix: true })}</p>
                          <p className="text-xs text-muted-foreground">{v.timestamp.toLocaleString()}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => v.vid && onRevert(v.vid)}>Revert</Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                    <div className="text-center text-sm text-muted-foreground p-4 flex flex-col items-center justify-center h-full">
                        <History className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-semibold">Version History</p>
                        <p>No version history for this file yet. Save the file to create a version.</p>
                    </div>
                )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
