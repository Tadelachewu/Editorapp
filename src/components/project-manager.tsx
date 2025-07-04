
"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Code, Folder, PlusCircle, Trash2, FolderPlus, FilePlus, RotateCw } from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import type { ProjectItem, Language } from '@/lib/types';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from './ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ProjectManagerProps {
  items: ProjectItem[];
  activeFileId: string | null;
  onFileSelect: (id: string) => void;
  onNewItem: (parentId: string | null) => void;
  onItemDelete: (id: string) => void;
  onResetProject: () => void;
  useOllama: boolean;
  onOllamaToggle: (value: boolean) => void;
}

interface TreeItem extends ProjectItem {
    children: TreeItem[];
}

const buildTree = (items: ProjectItem[]): TreeItem[] => {
    const tree: TreeItem[] = [];
    const map: { [key: string]: TreeItem } = {};

    items.forEach(item => {
        map[item.id] = { ...item, children: [] };
    });

    items.forEach(item => {
        const node = map[item.id];
        if (item.parentId && map[item.parentId]) {
            map[item.parentId].children.push(node);
        } else {
            tree.push(node);
        }
    });

    // Sort items so folders come before files
    const sortItems = (nodes: TreeItem[]) => {
        nodes.sort((a, b) => {
            if (a.itemType === 'folder' && b.itemType === 'file') return -1;
            if (a.itemType === 'file' && b.itemType === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
        nodes.forEach(node => sortItems(node.children));
    };
    sortItems(tree);

    return tree;
};


const LanguageIcon = ({ language }: { language: Language | null }) => {
  if (language === 'React Native') {
    return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path d="m63.999.001c-35.346 0-63.999 28.653-63.999 63.999s28.653 63.999 63.999 63.999c35.346 0 63.999-28.653 63.999-63.999s-28.653-63.999-63.999-63.999zm0 121.5c-31.745 0-57.502-25.757-57.502-57.501s25.757-57.501 57.502-57.501 57.502 25.757 57.502 57.501-25.757 57.501-57.502 57.501z"/><path d="m76.124 50.85c-6.19-2.34-12.38-4.68-18.57-7.02l-1.404-.315c2.34-4.275 4.68-8.55 7.02-12.825l.315-1.404c-3.15-.735-6.3-1.47-9.45-2.205l-.945 2.04c-3.15 6.825-6.3 13.65-9.45 20.475-.735 1.575-1.47 3.15-2.205 4.725l18.255 7.965c-.105.315-.21.63-.315.945-1.155 3.465-2.31 6.93-3.465 10.395l-20.475-8.895c.84 2.835 1.68 5.67 2.52 8.505l.63 1.26c3.15.63 6.3 1.26 9.45 1.89l.945-2.145c3.045-7.035 6.09-14.07 9.135-21.105.735-1.68 1.47-3.36 2.205-5.04l-18.255-7.965c.105-.315.21-.63.315-.945 1.155-3.465 2.31-6.93 3.465-10.395l20.475 8.895c-.84-2.835-1.68-5.67-2.52-8.505zm-34.964-11.34c-1.89 4.095-3.78 8.19-5.67 12.285 2.205.42 4.41.84 6.615 1.26 2.31-4.725 4.62-9.45 6.93-14.175-2.52-.42-5.04-.84-7.875-1.365zm12.6 57.855c-4.41 1.68-8.82 3.36-13.23 5.04 1.26-2.415 2.52-4.83 3.78-7.245 4.83-1.89 9.66-3.78 14.49-5.67-1.575 2.52-3.15 5.04-5.04 7.875zm-1.89-28.35c-4.725 2.1-9.45 4.2-14.175 6.3 1.47-2.835 2.94-5.67 4.41-8.505 4.725-2.1 9.45-4.2 14.175-6.3-1.47 2.835-2.94 5.67-4.41 8.505zm14.175 14.175c-4.725 2.1-9.45 4.2-14.175 6.3 1.47-2.835 2.94-5.67 4.41-8.505 4.725-2.1 9.45-4.2 14.175-6.3-1.47 2.835-2.94 5.67-4.41 8.505z"/></svg>;
  }
  return <Code className="w-4 h-4" />;
};

const ProjectTree = ({
    nodes,
    activeFileId,
    onFileSelect,
    onNewItem,
    setDeleteCandidate,
    isMobile,
    level = 0
}: {
    nodes: TreeItem[];
    activeFileId: string | null;
    onFileSelect: (id: string) => void;
    onNewItem: (parentId: string | null) => void;
    setDeleteCandidate: (id: string | null) => void;
    isMobile: boolean;
    level?: number;
}) => {
    return (
        <div className="flex flex-col gap-1">
            {nodes.map(node => (
                node.itemType === 'folder' ? (
                    <Collapsible key={node.id} defaultOpen>
                        <div className="flex items-center group pr-2 rounded-md hover:bg-accent/50">
                            <CollapsibleTrigger className="flex-1 overflow-hidden">
                                <div className={cn("flex items-center gap-2 p-1.5 text-sm font-semibold")}>
                                    <Folder className="w-4 h-4" />
                                    <span className="truncate">{node.name}</span>
                                </div>
                            </CollapsibleTrigger>
                            <div className={cn("items-center gap-1 sm:gap-0", isMobile ? 'flex' : 'hidden group-hover:flex')}>
                                <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onNewItem(node.id)}>
                                    <FilePlus className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onNewItem(node.id)}>
                                    <FolderPlus className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setDeleteCandidate(node.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <CollapsibleContent className={cn("pl-4 sm:pl-5")}>
                            <ProjectTree
                                nodes={node.children}
                                activeFileId={activeFileId}
                                onFileSelect={onFileSelect}
                                onNewItem={onNewItem}
                                setDeleteCandidate={setDeleteCandidate}
                                isMobile={isMobile}
                                level={level + 1}
                            />
                        </CollapsibleContent>
                    </Collapsible>
                ) : (
                    <div key={node.id} className="flex items-center group pr-2">
                        <button
                           onClick={() => onFileSelect(node.id)}
                           className={cn(
                               "flex items-center gap-2 p-1.5 text-sm flex-1 cursor-pointer rounded-md overflow-hidden text-left w-full hover:bg-accent/50",
                               activeFileId === node.id && "bg-accent"
                           )}
                        >
                            <LanguageIcon language={node.language} />
                            <span className="truncate">{node.name}</span>
                        </button>
                        <Button variant="ghost" size="icon" className={cn("w-6 h-6 ml-1", isMobile ? 'flex' : 'hidden group-hover:flex')} onClick={() => setDeleteCandidate(node.id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )
            ))}
        </div>
    );
};


export function ProjectManager({ items, activeFileId, onFileSelect, onNewItem, onItemDelete, onResetProject, useOllama, onOllamaToggle }: ProjectManagerProps) {
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const isMobile = useIsMobile();

  const fileTree = useMemo(() => (items ? buildTree(items) : []), [items]);
  const itemToDelete = items.find(f => f.id === deleteCandidate);

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
            <div className='flex items-center gap-2'>
              <Image
                src="https://lh3.googleusercontent.com/a/ACg8ocKZi27ETTwwwG_Hhwo2juaRqQ17YqHkyxyk-5Mu8IzIMmj2Lg8=s288-c-no"
                alt="Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-sm font-semibold sm:text-base">File Manager</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => onNewItem(null)} className="w-7 h-7" title="New Item">
                <PlusCircle className="w-5 h-5" />
              </Button>
               <Button variant="ghost" size="icon" onClick={() => setShowResetConfirm(true)} className="w-7 h-7" title="Reset Project">
                <RotateCw className="w-5 h-5" />
              </Button>
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        <div className="flex-1 overflow-y-auto px-2">
            {!items ? (
              <div className="space-y-2 p-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : items.length === 0 ? (
                <div className="text-center p-4 text-sm text-muted-foreground">
                    <p>No files yet.</p>
                    <Button variant="link" onClick={() => onNewItem(null)}>Create a new item</Button>
                </div>
            ) : (
                <ProjectTree 
                    nodes={fileTree}
                    activeFileId={activeFileId}
                    onFileSelect={onFileSelect}
                    onNewItem={onNewItem}
                    setDeleteCandidate={setDeleteCandidate}
                    isMobile={isMobile}
                />
          )}
        </div>
        <div className='mt-auto p-2'>
            <SidebarSeparator className="my-2" />
            <div className="p-2 space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">AI Settings</Label>
                <div className="flex items-center justify-between">
                    <Label htmlFor="ollama-toggle" className="text-sm">
                        Use Ollama (Local)
                    </Label>
                    <Switch
                        id="ollama-toggle"
                        checked={useOllama}
                        onCheckedChange={onOllamaToggle}
                    />
                </div>
                 <p className="text-xs text-muted-foreground">
                    {useOllama
                      ? "Using local Ollama models. Ensure Ollama is running."
                      : "Using Google AI. Ensure your API key is set."}
                  </p>
            </div>
        </div>
      </SidebarContent>

      <AlertDialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{itemToDelete?.name}" and all of its contents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCandidate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if(deleteCandidate) onItemDelete(deleteCandidate); setDeleteCandidate(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete all your files and changes, restoring the project to its original state. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowResetConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onResetProject(); setShowResetConfirm(false); }}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    