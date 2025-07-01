"use client";

import { useState, useEffect, useRef } from 'react';
import { Bot, History, Loader2, MessageSquare, User, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { generateCodeImprovements } from '@/ai/flows/generate-code-improvements';
import { chatWithCode } from '@/ai/flows/chat-with-code';
import type { ProjectItem, DbVersion } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ToolPanelProps {
  file: ProjectItem | undefined;
  content: string;
  history: DbVersion[];
  onRevert: (versionId: number) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCodeUpdate: (newCode: string) => void;
}

export function ToolPanel({
  file,
  content,
  history,
  onRevert,
  activeTab,
  onTabChange,
  onCodeUpdate,
}: ToolPanelProps) {
  const [improvements, setImprovements] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset chat when file changes
    setChatMessages([]);
  }, [file?.id]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [chatMessages]);

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

  const handleChatFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendChatMessage();
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agent"><MessageSquare className="w-4 h-4 mr-1" /> Agent</TabsTrigger>
            <TabsTrigger value="improvements"><Bot className="w-4 h-4 mr-1" /> Improvements</TabsTrigger>
            <TabsTrigger value="history"><History className="w-4 h-4 mr-1" /> History</TabsTrigger>
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

          <TabsContent value="improvements" className="flex-1 mt-4 overflow-y-auto flex flex-col items-center justify-center text-center">
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <p className="mt-4 text-sm text-muted-foreground">Generating improvements...</p>
                </>
            ) : improvements ? (
                <ScrollArea className="w-full h-full">
                    <pre className="whitespace-pre-wrap rounded-md bg-secondary p-4 font-code text-sm text-left">{improvements}</pre>
                </ScrollArea>
            ) : (
                <>
                  <Bot className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-semibold mb-2">Code Improvements</p>
                  <p className="text-sm text-muted-foreground mb-4">Analyze your code for suggestions on quality, readability, and performance.</p>
                  <Button onClick={handleGenerateImprovements}>
                    Analyze Code
                  </Button>
                </>
            )}
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
                    <Button variant="ghost" size="sm" onClick={() => v.vid && onRevert(v.vid)}>Revert</Button>
                  </li>
                ))}
              </ul>
            ) : (
                <div className="text-center text-sm text-muted-foreground p-4 flex-1 flex flex-col items-center justify-center">
                    <History className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">Version History</p>
                    <p>No version history for this file yet. Save the file to create a version.</p>
                </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
