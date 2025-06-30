"use client";

import { useState, useEffect, useRef } from 'react';
import { Bot, History, Loader2, Terminal, MessageSquare, User, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { generateCodeImprovements } from '@/ai/flows/generate-code-improvements';
import { chatWithCode } from '@/ai/flows/chat-with-code';
import type { ProjectItem, DbVersion, Language } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ToolPanelProps {
  file: ProjectItem | undefined;
  content: string;
  history: DbVersion[];
  onRevert: (versionId: number) => void;
  isExecuting: boolean;
  executionOutput: string;
  onExecutionInput: (input: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCodeUpdate: (newCode: string) => void;
}

export function ToolPanel({ file, content, history, onRevert, isExecuting, executionOutput, onExecutionInput, activeTab, onTabChange, onCodeUpdate }: ToolPanelProps) {
  const [improvements, setImprovements] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  const [executionInput, setExecutionInput] = useState('');

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const interactiveLanguages: (Language | null)[] = ['C++', 'Python', 'Java', 'Go', 'Node.js'];
  const showInput = interactiveLanguages.includes(file?.language || null) && !!executionOutput && !isExecuting;

  useEffect(() => {
    // Reset chat when file changes
    setChatMessages([]);
  }, [file?.id]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        // The viewport is the scrollable element in ShadCN's ScrollArea
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [executionOutput]);

  useEffect(() => {
    // Focus the input when it appears or when the tab becomes active and input is possible
    if (activeTab === 'output' && showInput) {
        inputRef.current?.focus();
    }
  }, [showInput, activeTab, executionOutput]);

  const handleGenerateImprovements = async () => {
    if (!file || !file.language) return;
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

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !file || !file.language) return;

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
      });
      const assistantMessage = { role: 'assistant' as const, content: result.response };
      setChatMessages(prev => [...prev, assistantMessage]);

      if (result.updatedCode) {
        onCodeUpdate(result.updatedCode);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = { role: 'assistant' as const, content: "Sorry, I couldn't get a response. Please try again." };
      setChatMessages(prev => [...prev, errorMessage]);
      toast({ variant: "destructive", title: "Error", description: "Failed to get response from AI agent." });
    } finally {
      setIsChatting(false);
    }
  };

  const handleSendExecutionInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!executionInput.trim() || isExecuting) return;
    onExecutionInput(executionInput);
    setExecutionInput('');
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
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="output"><Terminal className="w-4 h-4 mr-1" /> Output</TabsTrigger>
            <TabsTrigger value="agent"><MessageSquare className="w-4 h-4 mr-1" /> Agent</TabsTrigger>
            <TabsTrigger value="improvements"><Bot className="w-4 h-4 mr-1" /> Improvements</TabsTrigger>
            <TabsTrigger value="history"><History className="w-4 h-4 mr-1" /> History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="output" className="flex-1 flex flex-col min-h-0 mt-2">
            {isExecuting && !executionOutput ? (
              <div className="flex items-center text-sm text-muted-foreground p-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing code...
              </div>
            ) : executionOutput ? (
              <>
                <h3 className="text-sm font-semibold mb-2 px-1">Execution Output</h3>
                <ScrollArea className="flex-1 -mx-1 px-1" ref={scrollAreaRef}>
                    <div 
                      className="rounded-md bg-secondary p-4 font-code text-sm h-full cursor-text" 
                      onClick={() => inputRef.current?.focus()}
                    >
                        <pre className="whitespace-pre-wrap">{executionOutput}</pre>
                        {isExecuting && (
                            <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />
                        )}
                        {showInput && (
                          <form onSubmit={handleSendExecutionInput} className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">&gt;</span>
                            <Textarea
                              ref={inputRef}
                              value={executionInput}
                              onChange={(e) => setExecutionInput(e.target.value)}
                              placeholder=""
                              className="flex-1 resize-none bg-transparent p-0 border-0 focus-visible:ring-0 focus:outline-none shadow-none font-code text-sm h-auto"
                              rows={1}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendExecutionInput(e as any);
                                }
                              }}
                            />
                          </form>
                        )}
                    </div>
                </ScrollArea>
              </>
            ) : (
              <div className="text-center text-sm text-muted-foreground p-4">
                <p>
                  Click the "Run" button in the editor to execute the code and
                  see the output here.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="agent" className="flex-1 flex flex-col min-h-0 mt-2">
            <ScrollArea className="flex-1 -mx-6 px-6 py-4">
                <div className="space-y-4">
                    {chatMessages.length === 0 && !isChatting && (
                         <div className="text-center text-sm text-muted-foreground p-4">
                            <p>Ask the AI agent about your code.</p>
                            <p className="text-xs">e.g., "Explain this function", "How can I improve this?", "Write a test for this code."</p>
                        </div>
                    )}
                    {chatMessages.map((message, index) => (
                      <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : '')}>
                        {message.role === 'assistant' && <div className="p-2 rounded-full bg-primary text-primary-foreground flex-shrink-0"><Bot className="w-4 h-4" /></div>}
                        <div className={cn(
                          "rounded-lg p-3 text-sm max-w-sm md:max-w-md lg:max-w-lg",
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
            <form onSubmit={handleSendChatMessage} className="flex items-center gap-2 pt-2 border-t mt-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask the AI agent anything..."
                  className="min-h-[40px] flex-1 resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage(e as any);
                    }
                  }}
                />
                <Button type="submit" disabled={isChatting || !chatInput.trim()} size="icon">
                  <Send className="w-4 h-4" />
                  <span className="sr-only">Send</span>
                </Button>
            </form>
          </TabsContent>

          <TabsContent value="improvements" className="flex-1 mt-4 overflow-y-auto">
            <Button onClick={handleGenerateImprovements} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
              Analyze Code for Improvements
            </Button>
            {isLoading && !improvements && <p className="mt-4 text-sm text-muted-foreground">Generating...</p>}
            {improvements && <pre className="mt-4 whitespace-pre-wrap rounded-md bg-secondary p-4 font-code text-sm">{improvements}</pre>}
          </TabsContent>
          <TabsContent value="history" className="flex-1 mt-4 overflow-y-auto">
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
        </Tabs>
      </CardContent>
    </Card>
  );
}
