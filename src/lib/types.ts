export type FileType = 'cpp' | 'rn' | 'py' | 'js' | 'java' | 'go' | 'html';

export type Language = 'C++' | 'React Native' | 'Python' | 'JavaScript' | 'Java' | 'Go' | 'Node.js' | 'Web';

export type ProjectItem = {
  id: string;
  name: string;
  itemType: 'file' | 'folder';
  parentId: string | null;
  language: Language | null;
  fileType: FileType | null;
};

export type FileContent = {
  id: string; // This is the file ID
  content: string;
}

export type DbVersion = {
  vid?: number; // Primary key, auto-incremented. Optional for creation.
  fileId: string;
  content: string;
  timestamp: Date;
}


export type FileContentStore = Record<string, string>;
