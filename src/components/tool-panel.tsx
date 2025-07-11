
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Bot, History, Loader2, MessageSquare, User, Send, Terminal, Eye, Wand2, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const [executionInput, setExecutionInput] = useState('');

  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const isWebApp = file?.language === 'Web';
  const isMobile = useIsMobile();

  const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);
  const allSuggestions = useMemo(() => [
      'Explain this code to me',
      'Refactor this code for readability',
      'Find potential bugs in this code',
      'Add comments to explain what this does',
      'How can I improve the performance of this code?',
      'What does this specific function do: ',
      'Add proper error handling',
    ], []);

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

      } catch(e: unknown) {
          console.error("Error generating web preview:", e);
          let errorDescription = 'Could not generate the web preview.';
          if (e instanceof Error) {
              errorDescription = e.message;
          } else if (typeof e === 'string') {
            errorDescription = e;
          }
          toast({ variant: 'destructive', title: 'Preview Error', description: errorDescription });
          const errorBlob = new Blob([`<h1>Preview Error</h1><p>${errorDescription}</p>`], { type: 'text/html' });
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
    const executionOutputEl = document.querySelector('#execution-output-scroll-area div[data-radix-scroll-area-viewport]');
    if (executionOutputEl) {
      executionOutputEl.scrollTop = executionOutputEl.scrollHeight;
    }
  }, [executionTranscript, isExecuting, isWaitingForInput]);

  const handleGenerateImprovements = async () => {
    if (!file || !file.language) return;
    setIsLoading(true);
    setImprovementResult(null);
    try {
      const result = await generateCodeImprovements({ code: content, language: file.language }, { useOllama });
      if (result && (result.improvedCode || result.suggestions)) {
        setImprovementResult(result);
      } else {
         setImprovementResult({ 
          suggestions: "The AI did not suggest any changes for the current code.", 
          improvedCode: null 
        });
      }
    } catch (error: unknown) {
      console.error(error);
      let description = "An error occurred while analyzing the code. The AI may have failed to return a valid response.";
      if (error instanceof Error) {
        description = error.message;
      }
      setImprovementResult({ suggestions: `Error: ${description}`, improvedCode: null });
      toast({ variant: "destructive", title: "Analysis Failed", description });
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
      setImprovementResult(null);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !file || !file.language || isChatting) return;

    const userMessage = { role: 'user' as const, content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setChatSuggestions([]);
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
    } catch (error: unknown) {
      console.error(error);
      
      let errorMessageContent = "Sorry, I couldn't get a response. Please try again.";
      if (error instanceof Error) {
        errorMessageContent = error.message;
      }
      
      const errorMessage = { role: 'assistant' as const, content: errorMessageContent };
      setChatMessages(prev => [...prev, errorMessage]);
      
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: errorMessageContent 
      });
    } finally {
      setIsChatting(false);
    }
  };
  
  const handleChatInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setChatInput(value);

    if (value.trim().length > 2) {
      const filtered = allSuggestions
        .filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
        .slice(0, 3);
      setChatSuggestions(filtered);
    } else {
      setChatSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setChatInput(suggestion);
    setChatSuggestions([]);
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
      <CardHeader className="flex-row items-center justify-between p-2 border-b h-12">
        <CardTitle className="text-sm font-semibold sm:text-base">Tools</CardTitle>
        {!isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} title="Close panel">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-2 min-h-0">
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-start h-auto">
            <TabsTrigger value="agent">
              <MessageSquare className="mr-2 h-4 w-4"/>
              Agent
            </TabsTrigger>
            {isWebApp ? (
              <TabsTrigger value="preview">
                <Eye className="mr-2 h-4 w-4"/>
                Preview
              </TabsTrigger>
            ) : (
              <TabsTrigger value="output">
                <Terminal className="mr-2 h-4 w-4"/>
                Output
              </TabsTrigger>
            )}
            <TabsTrigger value="improvements">
              <Bot className="mr-2 h-4 w-4"/>
              Improvements
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4"/>
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="agent" className="flex-1 flex flex-col min-h-0 mt-2">
            <ScrollArea className="flex-1 -mx-2 px-2" ref={scrollAreaRef}>
                <div className="space-y-4 pr-2">
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
            <div className="mt-auto pt-2 border-t">
              {chatSuggestions.length > 0 && (
                  <div className="mb-2">
                      <div className="flex flex-wrap gap-2">
                          {chatSuggestions.map((suggestion, index) => (
                              <Button 
                                  key={index} 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-auto text-left py-1 px-2"
                                  onClick={() => handleSuggestionClick(suggestion)}
                              >
                                  {suggestion}
                              </Button>
                          ))}
                      </div>
                  </div>
              )}
              <form onSubmit={handleChatFormSubmit} className="flex items-center gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={handleChatInputChange}
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
            </div>
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
                <ScrollArea
                  id="execution-output-scroll-area"
                  className="flex-1 bg-muted/20 rounded-md p-4"
                >
                  <div className="font-mono text-sm whitespace-pre-wrap relative flex flex-col min-h-full">
                      <div className="flex-1">
                          <span>{executionTranscript}</span>
                          {isWaitingForInput && (
                              <form
                                  onSubmit={handleExecutionInputSubmit}
                                  className="inline-flex items-baseline gap-2 w-auto"
                              >
                                  <Input
                                      value={executionInput}
                                      onChange={(e) => setExecutionInput(e.target.value)}
                                      className="flex-1 h-auto p-0 m-0 bg-transparent border-0 shadow-none appearance-none focus-visible:ring-0 font-mono text-sm inline w-auto"
                                      placeholder="Type input..."
                                      autoFocus
                                      spellCheck="false"
                                      size={executionInput.length || 15}
                                  />
                              </form>
                          )}
                      </div>
                       {isExecuting && !isWaitingForInput && (
                        <div className="flex items-center text-muted-foreground mt-2 font-mono text-sm">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Executing...</span>
                        </div>
                      )}
                  </div>
                </ScrollArea>
            </TabsContent>
          )}

          <TabsContent value="improvements" className="flex-1 mt-2 flex flex-col min-h-0">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Generating improvements...</p>
              </div>
            ) : improvementResult ? (
              <div className='flex-1 flex flex-col min-h-0 gap-4'>
                {improvementResult.suggestions ? (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 px-1">Suggestions</h4>
                    <ScrollArea className="h-48 max-h-[40vh] bg-muted/20 rounded-md p-4 border">
                        <pre className="font-sans text-sm whitespace-pre-wrap">{improvementResult.suggestions}</pre>
                    </ScrollArea>
                  </div>
                ) : null}
                
                <div className="flex-1 flex flex-col min-h-0">
                  <h4 className="text-sm font-semibold mb-2 px-1">Improved Code</h4>
                  {improvementResult.improvedCode ? (
                    <ScrollArea className="flex-1 bg-muted/20 rounded-md border">
                        <pre className="font-mono text-sm whitespace-pre-wrap p-4">{improvementResult.improvedCode}</pre>
                    </ScrollArea>
                  ) : (
                    <div className="flex-1 flex items-center justify-center rounded-md border bg-muted/20 text-muted-foreground text-sm">
                        No code changes suggested.
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 mt-auto border-t">
                    <Button onClick={() => setImprovementResult(null)} variant="outline" className="w-full">
                        Back
                    </Button>
                    <Button onClick={handleApplyImprovements} className="w-full" disabled={!improvementResult.improvedCode}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Apply Improvements
                    </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="flex h-full items-center justify-center p-2">
                  <Card className="w-full max-w-md text-center shadow-none border-0 sm:border sm:shadow-sm">
                    <CardHeader>
                      <div className="mx-auto p-3 rounded-full bg-primary/10 text-primary mb-2 border border-primary/20 w-fit">
                        <Wand2 className="w-8 h-8" />
                      </div>
                      <CardTitle>Code Improvements</CardTitle>
                      <CardDescription>
                        Let AI analyze your code and suggest improvements for readability, performance, and best practices.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="text-sm text-muted-foreground space-y-2 text-left bg-muted/30 p-4 rounded-md border">
                          <li className="flex items-start gap-3"><Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" /> <span>Readability and clarity</span></li>
                          <li className="flex items-start gap-3"><Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" /> <span>Performance optimizations</span></li>
                          <li className="flex items-start gap-3"><Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" /> <span>Best practice adherence</span></li>
                      </ul>
                      <Button onClick={handleGenerateImprovements} className="w-full">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Analyze Code
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          <TabsContent value="history" className="flex-1 flex flex-col min-h-0 mt-2">
            <ScrollArea className="flex-1 -mx-2 px-2">
                {history.length > 0 ? (
                  <ul className="space-y-2 pr-2">
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
