export type FileType = 'cpp' | 'rn' | 'py' | 'js' | 'java' | 'go';

export type Language = 'C++' | 'React Native' | 'Python' | 'JavaScript' | 'Java' | 'Go';

export type ProjectFile = {
  id: string;
  name: string;
  type: FileType;
  language: Language;
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
