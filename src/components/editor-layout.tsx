
"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { ProjectManager } from '@/components/project-manager';
import { CodeEditor } from '@/components/code-editor';
import { ToolPanel } from '@/components/tool-panel';
import { NewFileDialog } from '@/components/new-file-dialog';
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { db, resetDatabase } from '@/lib/db';
import type { ProjectItem, FileContent, Language, FileType, DbVersion } from '@/lib/types';
import { fileTemplates } from '@/lib/initial-data';
import { executeCode } from '@/ai/flows/execute-code';
import { useIsMobile } from '@/hooks/use-mobile';
import { Code, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

function EditorLayoutContent() {
  const { toast } = useToast();
  const { setOpenMobile } = useSidebar();

  const allItems = useLiveQuery(() => db.items.orderBy('name').toArray(), []);
  
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newItemParentId, setNewItemParentId] = useState<string | null>(null);

  const [activeToolTab, setActiveToolTab] = useState('agent');

  const [isExecuting, setIsExecuting] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [executionTranscript, setExecutionTranscript] = useState('');
  const executionStateRef = useRef({ isRunning: false });

  const [useOllama, setUseOllama] = useLocalStorage('useOllama', true);
  
  const isMobile = useIsMobile();
  const [activeMobileView, setActiveMobileView] = useState<'editor' | 'tools'>('editor');

  useEffect(() => {
    if (allItems && allItems.length > 0) {
      const activeFileExists = allItems.some(f => f.id === activeFileId);
      if ((!activeFileId || !activeFileExists)) {
        const firstFile = allItems.find(item => item.itemType === 'file');
        if (firstFile) {
          setActiveFileId(firstFile.id);
        }
      }
    } else if (allItems && allItems.length === 0) {
      setActiveFileId(null);
    }
  }, [allItems, activeFileId]);

  useEffect(() => {
    let stale = false;
    if (activeFileId) {
      db.fileContents.get(activeFileId).then(fileContent => {
        if (!stale && fileContent) {
          setCurrentContent(fileContent.content);
        } else if (!stale) {
          setCurrentContent('');
        }
      });
    } else {
      setCurrentContent('');
    }
    return () => { 
      stale = true; 
    };
  }, [activeFileId]);

  const activeFile = allItems?.find(f => f.id === activeFileId);
  const activeFileHistory = useLiveQuery(async () => {
    if (!activeFileId) return [];
    const versions = await db.versions.where('fileId').equals(activeFileId).sortBy('timestamp');
    return versions.reverse();
  }, [activeFileId]);


  const handleFileSelect = useCallback((id: string) => {
    const item = allItems?.find(i => i.id === id);
    if (item?.itemType === 'file') {
      setActiveFileId(id);
      setActiveToolTab('agent');
      if (isMobile) {
        setActiveMobileView('editor');
        setOpenMobile(false);
      }
    }
  }, [allItems, isMobile, setOpenMobile]);

  const handleContentChange = useCallback((content: string) => {
    setCurrentContent(content);
  }, []);

  const handleCodeUpdate = useCallback((newCode: string) => {
    setCurrentContent(newCode);
    toast({
        title: "Code Updated",
        description: "The AI agent has updated the code in your editor.",
    });
  }, [toast]);

  const handleSave = useCallback(async () => {
    if (activeFileId) {
      await db.transaction('rw', db.fileContents, db.versions, async () => {
        await db.fileContents.put({ id: activeFileId, content: currentContent });
        await db.versions.add({
          fileId: activeFileId,
          content: currentContent,
          timestamp: new Date()
        });
      });
      toast({
        title: "File Saved",
        description: `${activeFile?.name} has been saved.`,
      });
    }
  }, [activeFileId, currentContent, activeFile?.name, toast]);

  const handleRevert = useCallback(async (versionId: number) => {
    if (activeFileId) {
      const versionToRevert = await db.versions.get(versionId);
      if (versionToRevert) {
        setCurrentContent(versionToRevert.content);
        await db.fileContents.put({ id: activeFileId, content: versionToRevert.content });
        toast({
          title: "File Reverted",
          description: `${activeFile?.name} has been reverted to a previous version.`,
        });
      }
    }
  }, [activeFileId, activeFile?.name, toast]);

  const openNewItemDialog = (parentId: string | null) => {
    setNewItemParentId(parentId);
    setIsNewFileDialogOpen(true);
  };

  const handleCreateItem = async (name: string, itemType: 'file' | 'folder', language: Language | null, fileType: FileType | null) => {
    const newItem: ProjectItem = { 
        id: uuidv4(), 
        name, 
        itemType,
        parentId: newItemParentId,
        language,
        fileType,
    };
    
    await db.transaction('rw', db.items, db.fileContents, async () => {
        await db.items.add(newItem);
        if (newItem.itemType === 'file' && newItem.language) {
            const newContent: FileContent = { 
              id: newItem.id, 
              content: fileTemplates[newItem.language] || `// New file: ${name}` 
            };
            await db.fileContents.add(newContent);
            setActiveFileId(newItem.id);
        }
    });
    setIsNewFileDialogOpen(false);
    setNewItemParentId(null);
    toast({ title: "Item Created", description: `Successfully created ${name}` });
  };
  
  const getChildrenRecursive = async (parentId: string): Promise<string[]> => {
      const children = await db.items.where('parentId').equals(parentId).toArray();
      let allDescendants: string[] = [];
      for (const child of children) {
          allDescendants.push(child.id);
          if (child.itemType === 'folder') {
              const grandChildren = await getChildrenRecursive(child.id);
              allDescendants = [...allDescendants, ...grandChildren];
          }
      }
      return allDescendants;
  };

  const handleDeleteItem = async (id: string) => {
    const itemToDelete = allItems?.find(f => f.id === id);
    if (!itemToDelete) return;

    const idsToDelete = [id];
    if (itemToDelete.itemType === 'folder') {
        const childrenIds = await getChildrenRecursive(id);
        idsToDelete.push(...childrenIds);
    }

    await db.transaction('rw', db.items, db.fileContents, db.versions, async () => {
        await db.items.bulkDelete(idsToDelete);
        const fileIdsInDb = await db.items.bulkGet(idsToDelete);
        const fileIdsToDelete = fileIdsInDb
            .filter((item): item is ProjectItem => !!item && item.itemType === 'file')
            .map(item => item!.id);
            
        await db.fileContents.bulkDelete(fileIdsToDelete);
        for (const fileId of fileIdsToDelete) {
            await db.versions.where('fileId').equals(fileId).delete();
        }
    });

    if (activeFileId && idsToDelete.includes(activeFileId)) {
      setActiveFileId(null);
    }
    toast({ variant: "destructive", title: "Item Deleted", description: `Successfully deleted ${itemToDelete.name} and its contents.` });
  };
  
  const handleResetProject = async () => {
    try {
        await resetDatabase();
        toast({
            title: "Project Reset",
            description: "The project is being restored. The page will now reload.",
        });
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (error) {
        console.error("Failed to reset project:", error);
        toast({
            variant: "destructive",
            title: "Reset Failed",
            description: "Could not reset the project. Please check the console for errors.",
        });
    }
  };

  const continueExecution = useCallback(async (fromTranscript: string, userInput?: string) => {
    if (!activeFile || !activeFile.language || !currentContent) return;

    let currentTranscript = fromTranscript;
    if (userInput !== undefined) {
      currentTranscript += userInput + '\n';
      setExecutionTranscript(currentTranscript);
    }

    let hasMore = true;
    let shouldPauseForInput = false;
    try {
      while (executionStateRef.current.isRunning && hasMore && !shouldPauseForInput) {
        const result = await executeCode({
          code: currentContent,
          language: activeFile.language,
          previousTranscript: currentTranscript,
        }, { useOllama });

        if (!executionStateRef.current.isRunning) break;

        if (result.output) {
          currentTranscript += result.output;
          setExecutionTranscript(currentTranscript);
        }
        hasMore = result.hasMoreOutput;

        if (result.isWaitingForInput) {
          shouldPauseForInput = true;
          setIsWaitingForInput(true);
        }
      }
    } catch (error) {
      console.error("Execution error:", error);
      const description = error instanceof Error ? error.message : "The AI simulator failed to return a valid response. This can happen with complex code. Please try again.";
      setExecutionTranscript(prev => prev + `\n[ERROR: ${description}]`);
      toast({ variant: 'destructive', title: 'Execution Error', description });
    } finally {
      if (!shouldPauseForInput) {
        if (executionStateRef.current.isRunning) {
            setExecutionTranscript(prev => {
                const trimmedPrev = prev.trim();
                if (trimmedPrev.startsWith('[ERROR:')) return prev;
                
                const finalMessage = trimmedPrev === '' ? '[Program finished with no output]' : '[Program finished]';
                
                if (!trimmedPrev.endsWith(finalMessage) && !trimmedPrev.endsWith('[Program finished]')) {
                    return (prev.endsWith('\n') || prev === '' ? prev : prev + '\n') + finalMessage;
                }
                return prev;
            });
        }
        setIsExecuting(false);
        executionStateRef.current.isRunning = false;
      }
    }
  }, [activeFile, currentContent, toast, useOllama]);

  const handleRunCode = useCallback(() => {
    if (activeFile?.language === 'Web') {
      setActiveToolTab('preview');
       if (isMobile) {
        setActiveMobileView('tools');
      }
      return;
    }

    if (isExecuting) {
      executionStateRef.current.isRunning = false;
      setIsExecuting(false);
      setIsWaitingForInput(false);
      setExecutionTranscript(prev => (prev.endsWith('\n') ? prev : prev + '\n') + '[Execution stopped by user]');
      toast({ title: 'Execution Stopped' });
      return;
    }

    executionStateRef.current.isRunning = true;
    setIsExecuting(true);
    setIsWaitingForInput(false);
    setExecutionTranscript('');
    setActiveToolTab('output');
    if (isMobile) {
      setActiveMobileView('tools');
    }
    toast({ title: 'Execution Started' });

    continueExecution('');
  }, [isExecuting, continueExecution, toast, activeFile, isMobile]);

  const handleExecuteInput = useCallback((input: string) => {
    if (!isWaitingForInput) return;

    setIsWaitingForInput(false);
    continueExecution(executionTranscript, input);
  }, [isWaitingForInput, executionTranscript, continueExecution]);

  useEffect(() => {
    if (executionStateRef.current.isRunning) {
      executionStateRef.current.isRunning = false;
      setIsExecuting(false);
      setIsWaitingForInput(false);
    }
    setExecutionTranscript('');
  }, [activeFileId]);


  return (
    <>
       <NewFileDialog
        open={isNewFileDialogOpen}
        onOpenChange={setIsNewFileDialogOpen}
        onItemCreate={handleCreateItem}
      />
      <div className="flex h-screen bg-background">
        <Sidebar>
          <ProjectManager 
            items={allItems || []} 
            activeFileId={activeFileId} 
            onFileSelect={handleFileSelect}
            onNewItem={openNewItemDialog}
            onItemDelete={handleDeleteItem}
            onResetProject={handleResetProject}
            useOllama={useOllama}
            onOllamaToggle={setUseOllama}
          />
        </Sidebar>
        <SidebarInset className="!m-0 !rounded-none !shadow-none flex-1 pb-14 md:pb-0">
          <div className="flex flex-1 flex-col md:flex-row w-full min-h-0">
            <div className="md:hidden absolute top-2 left-2 z-20">
              <SidebarTrigger />
            </div>

            <div className={cn("w-full flex-1 flex-col p-1 sm:p-2 md:w-1/2", isMobile ? (activeMobileView === 'editor' ? 'flex' : 'hidden') : 'flex')}>
                <CodeEditor
                  file={activeFile}
                  content={currentContent}
                  onContentChange={handleContentChange}
                  onSave={handleSave}
                  onRun={handleRunCode}
                  isRunning={isExecuting}
                  useOllama={useOllama}
                  isVisible={!isMobile || activeMobileView === 'editor'}
                />
            </div>
            
            <div className={cn("w-full flex-1 flex-col border-t md:border-t-0 md:border-l border-border p-1 sm:p-2 md:w-1/2", isMobile ? (activeMobileView === 'tools' ? 'flex' : 'hidden') : 'flex')}>
                <ToolPanel
                  key={activeFileId}
                  file={activeFile}
                  content={currentContent}
                  allItems={allItems || []}
                  history={activeFileHistory || []}
                  onRevert={handleRevert}
                  activeTab={activeToolTab}
                  onTabChange={setActiveToolTab}
                  onCodeUpdate={handleCodeUpdate}
                  isExecuting={isExecuting}
                  isWaitingForInput={isWaitingForInput}
                  executionTranscript={executionTranscript}
                  onExecuteInput={handleExecuteInput}
                  useOllama={useOllama}
                />
            </div>
          </div>
        </SidebarInset>
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border flex h-14 md:hidden z-10">
            <Button
              variant={activeMobileView === 'editor' ? 'secondary' : 'ghost'}
              onClick={() => setActiveMobileView('editor')}
              className="flex-1 rounded-none h-full text-sm flex-col gap-1"
            >
              <Code className="w-5 h-5" />
              Editor
            </Button>
            <Button
              variant={activeMobileView === 'tools' ? 'secondary' : 'ghost'}
              onClick={() => setActiveMobileView('tools')}
              className="flex-1 rounded-none h-full text-sm flex-col gap-1"
            >
              <Wrench className="w-5 h-5" />
              Tools
            </Button>
          </div>
        )}
      </div>
    </>
  );
}


export function EditorLayout() {
  return (
    <SidebarProvider>
      <EditorLayoutContent />
    </SidebarProvider>
  );
}
