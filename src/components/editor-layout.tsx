"use client";

import { useState, useCallback } from 'react';
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ProjectManager } from '@/components/project-manager';
import { CodeEditor } from '@/components/code-editor';
import { ToolPanel } from '@/components/tool-panel';
import { initialFiles, initialContent, initialHistory } from '@/lib/initial-data';
import type { FileContentStore, FileHistoryStore, Version } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

export function EditorLayout() {
  const { toast } = useToast();
  const [files] = useState(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string | null>(initialFiles[0]?.id || null);
  const [fileContents, setFileContents] = useState<FileContentStore>(initialContent);
  const [fileHistories, setFileHistories] = useState<FileHistoryStore>(initialHistory);

  const activeFile = files.find(f => f.id === activeFileId);
  const activeFileContent = activeFileId ? fileContents[activeFileId] : '';
  const activeFileHistory = activeFileId ? fileHistories[activeFileId] ?? [] : [];

  const handleFileSelect = useCallback((id: string) => {
    setActiveFileId(id);
  }, []);

  const handleContentChange = useCallback((content: string) => {
    if (activeFileId) {
      setFileContents(prev => ({ ...prev, [activeFileId]: content }));
    }
  }, [activeFileId]);

  const handleSave = useCallback(() => {
    if (activeFileId) {
      const newVersion: Version = {
        id: `v${activeFileId}-${Date.now()}`,
        content: fileContents[activeFileId],
        timestamp: new Date(),
      };
      setFileHistories(prev => ({
        ...prev,
        [activeFileId]: [newVersion, ...(prev[activeFileId] ?? [])],
      }));
      toast({
        title: "File Saved",
        description: `${activeFile?.name} has been saved to version history.`,
      });
    }
  }, [activeFileId, fileContents, activeFile?.name, toast]);

  const handleRevert = useCallback((versionId: string) => {
    if (activeFileId) {
      const versionToRevert = fileHistories[activeFileId]?.find(v => v.id === versionId);
      if (versionToRevert) {
        setFileContents(prev => ({ ...prev, [activeFileId]: versionToRevert.content }));
        toast({
          title: "File Reverted",
          description: `${activeFile?.name} has been reverted to a previous version.`,
        });
      }
    }
  }, [activeFileId, fileHistories, activeFile?.name, toast]);

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar>
          <ProjectManager files={files} activeFileId={activeFileId} onFileSelect={handleFileSelect} />
        </Sidebar>
        <SidebarInset className="!m-0 !rounded-none !shadow-none flex-1">
          <div className="flex h-full w-full">
             <div className="md:hidden absolute top-2 left-2 z-20">
              <SidebarTrigger />
            </div>
            <div className="w-full lg:w-1/2 flex flex-col p-1 sm:p-2 h-full">
              <CodeEditor
                file={activeFile}
                content={activeFileContent}
                onContentChange={handleContentChange}
                onSave={handleSave}
              />
            </div>
            <div className="hidden lg:flex w-1/2 flex-col border-l border-border p-1 sm:p-2 h-full">
              <ToolPanel
                key={activeFileId}
                file={activeFile}
                content={activeFileContent}
                history={activeFileHistory}
                onRevert={handleRevert}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
