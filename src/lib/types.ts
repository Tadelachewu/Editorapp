export type FileType = 'cpp' | 'rn';

export type ProjectFile = {
  id: string;
  name: string;
  type: FileType;
  language: 'C++' | 'React Native';
};

export type Version = {
  id: string;
  content: string;
  timestamp: Date;
};

export type FileContentStore = Record<string, string>;
export type FileHistoryStore = Record<string, Version[]>;
