"use client";

import { useState, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ProjectManager } from '@/components/project-manager';
import { CodeEditor } from '@/components/code-editor';
import { ToolPanel } from '@/components/tool-panel';
import { NewFileDialog } from '@/components/new-file-dialog';
import { useToast } from "@/hooks/use-toast";
import { executeCode } from '@/ai/flows/execute-code';
import { db } from '@/lib/db';
import type { ProjectFile, FileContent, Language, FileType } from '@/lib/types';


export function EditorLayout() {
  const { toast } = useToast();

  const files = useLiveQuery(() => db.files.orderBy('name').toArray(), []);
  
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState('');
  const [activeToolTab, setActiveToolTab] = useState('improvements');
  
  // Effect to select the first file when the component loads or files change
  useEffect(() => {
    if (files && files.length > 0) {
      const activeFileExists = files.some(f => f.id === activeFileId);
      if (!activeFileId || !activeFileExists) {
        setActiveFileId(files[0].id);
      }
    } else if (files && files.length === 0) {
      setActiveFileId(null);
    }
  }, [files, activeFileId]);

  // Effect to load content when active file changes
  useEffect(() => {
    let stale = false;
    if (activeFileId) {
      setExecutionOutput('');
      db.fileContents.get(activeFileId).then(fileContent => {
        if (!stale && fileContent) {
          setCurrentContent(fileContent.content);
        }
      });
    } else {
      setCurrentContent('');
    }
    return () => { stale = true; };
  }, [activeFileId]);

  const activeFile = files?.find(f => f.id === activeFileId);
  const activeFileHistory = useLiveQuery(async () => {
    if (!activeFileId) return [];
    const versions = await db.versions.where('fileId').equals(activeFileId).sortBy('timestamp');
    return versions.reverse();
  }, [activeFileId]);


  const handleFileSelect = useCallback((id: string) => {
    setActiveFileId(id);
    setExecutionOutput('');
    setActiveToolTab('improvements');
  }, []);

  const handleContentChange = useCallback((content: string) => {
    setCurrentContent(content);
  }, []);

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

  const handleRun = useCallback(async () => {
    if (!activeFile) return;

    setIsExecuting(true);
    setExecutionOutput('');
    setActiveToolTab('output');

    try {
      const result = await executeCode({ code: currentContent, language: activeFile.language });
      if (result && typeof result.output === 'string') {
        setExecutionOutput(result.output);
      } else {
        throw new Error("The AI returned an invalid or empty response.");
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ variant: "destructive", title: "Execution Error", description: errorMessage });
      setExecutionOutput(`An error occurred during execution: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  }, [activeFile, currentContent, toast]);

  const handleCreateFile = async (name: string, language: Language, type: FileType) => {
    const newFile: ProjectFile = { id: uuidv4(), name, language, type };
    const newContent: FileContent = { id: newFile.id, content: `// New file: ${name}` };
    
    await db.transaction('rw', db.files, db.fileContents, async () => {
        await db.files.add(newFile);
        await db.fileContents.add(newContent);
    });
    setActiveFileId(newFile.id);
    setIsNewFileDialogOpen(false);
    toast({ title: "File Created", description: `Successfully created ${name}` });
  };

  const handleDeleteFile = async (id: string) => {
    const fileToDelete = files?.find(f => f.id === id);
    if (!fileToDelete) return;

    await db.transaction('rw', db.files, db.fileContents, db.versions, async () => {
        await db.files.delete(id);
        await db.fileContents.delete(id);
        await db.versions.where('fileId').equals(id).delete();
    });
    toast({ variant: "destructive", title: "File Deleted", description: `Successfully deleted ${fileToDelete.name}` });
  };

  return (
    <SidebarProvider>
       <NewFileDialog
        open={isNewFileDialogOpen}
        onOpenChange={setIsNewFileDialogOpen}
        onFileCreate={handleCreateFile}
      />
      <div className="flex h-screen bg-background">
        <Sidebar>
          <ProjectManager 
            files={files || []} 
            activeFileId={activeFileId} 
            onFileSelect={handleFileSelect}
            onNewFile={() => setIsNewFileDialogOpen(true)}
            onFileDelete={handleDeleteFile}
          />
        </Sidebar>
        <SidebarInset className="!m-0 !rounded-none !shadow-none flex-1">
          <div className="flex flex-col lg:flex-row h-full w-full">
             <div className="md:hidden absolute top-2 left-2 z-20">
              <SidebarTrigger />
            </div>
            <div className="w-full h-1/2 lg:h-full lg:w-1/2 flex flex-col p-1 sm:p-2">
              <CodeEditor
                file={activeFile}
                content={currentContent}
                onContentChange={handleContentChange}
                onSave={handleSave}
                onRun={handleRun}
              />
            </div>
            <div className="w-full h-1/2 lg:h-full lg:w-1/2 flex flex-col border-t lg:border-t-0 lg:border-l border-border p-1 sm:p-2">
              <ToolPanel
                key={activeFileId}
                file={activeFile}
                content={currentContent}
                history={activeFileHistory || []}
                onRevert={handleRevert}
                isExecuting={isExecuting}
                executionOutput={executionOutput}
                activeTab={activeToolTab}
                onTabChange={setActiveToolTab}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
