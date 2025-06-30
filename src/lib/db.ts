import Dexie, { type EntityTable } from 'dexie';
import type { ProjectFile, FileContent, DbVersion } from './types';
import { initialFiles, initialContent, initialHistorySeed } from './initial-data';

class CodeSyncDB extends Dexie {
  files!: EntityTable<ProjectFile, 'id'>;
  fileContents!: EntityTable<FileContent, 'id'>;
  versions!: EntityTable<DbVersion, 'vid'>;

  constructor() {
    super('CodeSyncDB');
    this.version(1).stores({
      files: 'id, name, language, type',
      fileContents: 'id', // Primary key is fileId
      versions: '++vid, fileId, timestamp', // Auto-incrementing primary key, and index on fileId
    });
  }
}

export const db = new CodeSyncDB();

db.on('populate', async () => {
  try {
    await db.transaction('rw', db.files, db.fileContents, db.versions, async () => {
      await db.files.bulkAdd(initialFiles);
      
      const contentsToAdd = Object.entries(initialContent).map(([id, content]) => ({ id, content }));
      await db.fileContents.bulkAdd(contentsToAdd);
  
      const historyToAdd = Object.entries(initialHistorySeed).flatMap(([fileId, versions]) => 
          versions.map(version => ({
              fileId,
              content: version.content,
              timestamp: version.timestamp
          }))
      );
      await db.versions.bulkAdd(historyToAdd);
    });
  } catch (error) {
    console.error("Failed to populate database:", error);
  }
});

// Open the database
db.open().catch(err => {
  console.error(`Failed to open db: ${err.stack || err}`);
});
