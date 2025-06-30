"use client";

import { Code, FileCode2 } from 'lucide-react';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarContent,
  SidebarGroupLabel,
  SidebarGroup
} from '@/components/ui/sidebar';
import type { ProjectFile } from '@/lib/types';
import { Badge } from './ui/badge';

interface ProjectManagerProps {
  files: ProjectFile[];
  activeFileId: string | null;
  onFileSelect: (id: string) => void;
}

export function ProjectManager({ files, activeFileId, onFileSelect }: ProjectManagerProps) {
  const cppFiles = files.filter(f => f.type === 'cpp');
  const rnFiles = files.filter(f => f.type === 'rn');

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <FileCode2 className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold">CodeSync Edit</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <SidebarGroup>
                <SidebarGroupLabel>C++ Files</SidebarGroupLabel>
                {cppFiles.map(file => (
                    <SidebarMenuItem key={file.id}>
                    <SidebarMenuButton
                        onClick={() => onFileSelect(file.id)}
                        isActive={activeFileId === file.id}
                        tooltip={file.name}
                    >
                        <Code className="w-4 h-4" />
                        <span>{file.name}</span>
                        <Badge variant="outline" className="ml-auto">C++</Badge>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarGroup>
             <SidebarGroup>
                <SidebarGroupLabel>React Native Files</SidebarGroupLabel>
                {rnFiles.map(file => (
                    <SidebarMenuItem key={file.id}>
                    <SidebarMenuButton
                        onClick={() => onFileSelect(file.id)}
                        isActive={activeFileId === file.id}
                        tooltip={file.name}
                    >
                        <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 128 128"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="m63.999.001c-35.346 0-63.999 28.653-63.999 63.999s28.653 63.999 63.999 63.999c35.346 0 63.999-28.653 63.999-63.999s-28.653-63.999-63.999-63.999zm0 121.5c-31.745 0-57.502-25.757-57.502-57.501s25.757-57.501 57.502-57.501 57.502 25.757 57.502 57.501-25.757 57.501-57.502 57.501z"/>
                            <path d="m76.124 50.85c-6.19-2.34-12.38-4.68-18.57-7.02l-1.404-.315c2.34-4.275 4.68-8.55 7.02-12.825l.315-1.404c-3.15-.735-6.3-1.47-9.45-2.205l-.945 2.04c-3.15 6.825-6.3 13.65-9.45 20.475-.735 1.575-1.47 3.15-2.205 4.725l18.255 7.965c-.105.315-.21.63-.315.945-1.155 3.465-2.31 6.93-3.465 10.395l-20.475-8.895c.84 2.835 1.68 5.67 2.52 8.505l.63 1.26c3.15.63 6.3 1.26 9.45 1.89l.945-2.145c3.045-7.035 6.09-14.07 9.135-21.105.735-1.68 1.47-3.36 2.205-5.04l-18.255-7.965c.105-.315.21-.63.315-.945 1.155-3.465 2.31-6.93 3.465-10.395l20.475 8.895c-.84-2.835-1.68-5.67-2.52-8.505zm-34.964-11.34c-1.89 4.095-3.78 8.19-5.67 12.285 2.205.42 4.41.84 6.615 1.26 2.31-4.725 4.62-9.45 6.93-14.175-2.52-.42-5.04-.84-7.875-1.365zm12.6 57.855c-4.41 1.68-8.82 3.36-13.23 5.04 1.26-2.415 2.52-4.83 3.78-7.245 4.83-1.89 9.66-3.78 14.49-5.67-1.575 2.52-3.15 5.04-5.04 7.875zm-1.89-28.35c-4.725 2.1-9.45 4.2-14.175 6.3 1.47-2.835 2.94-5.67 4.41-8.505 4.725-2.1 9.45-4.2 14.175-6.3-1.47 2.835-2.94 5.67-4.41 8.505zm14.175 14.175c-4.725 2.1-9.45 4.2-14.175 6.3 1.47-2.835 2.94-5.67 4.41-8.505 4.725-2.1 9.45-4.2 14.175-6.3-1.47 2.835-2.94 5.67-4.41 8.505z"/>
                        </svg>
                        <span>{file.name}</span>
                        <Badge variant="outline" className="ml-auto">RN</Badge>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
