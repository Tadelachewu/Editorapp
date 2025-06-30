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
import type { ProjectItem, FileContent, Language, FileType, DbVersion } from '@/lib/types';
import { fileTemplates } from '@/lib/initial-data';


export function EditorLayout() {
  const { toast } = useToast();

  const allItems = useLiveQuery(() => db.items.orderBy('name').toArray(), []);
  
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newItemParentId, setNewItemParentId] = useState<string | null>(null);


  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState('');
  const [activeToolTab, setActiveToolTab] = useState('improvements');
  
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
      setExecutionOutput('');
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
    return () => { stale = true; };
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
      setExecutionOutput('');
      setActiveToolTab('improvements');
    }
  }, [allItems]);

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

  const handleRun = useCallback(async () => {
    if (!activeFile || !activeFile.language) return;

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


  return (
    <SidebarProvider>
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
                onCodeUpdate={handleCodeUpdate}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
