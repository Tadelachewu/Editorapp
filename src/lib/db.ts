import Dexie, { type EntityTable } from 'dexie';
import type { ProjectItem, FileContent, DbVersion } from './types';
import { initialItems, initialContent, initialHistorySeed } from './initial-data';

class CodeSyncDB extends Dexie {
  items!: EntityTable<ProjectItem, 'id'>;
  fileContents!: EntityTable<FileContent, 'id'>;
  versions!: EntityTable<DbVersion, 'vid'>;

  constructor() {
    super('CodeSyncDB');
    this.version(1).stores({
      files: 'id, name, language, type',
      fileContents: 'id', // Primary key is fileId
      versions: '++vid, fileId, timestamp', // Auto-incrementing primary key, and index on fileId
    });
    this.version(2).stores({
      items: 'id, parentId, name, itemType', // New schema with parentId for hierarchy
      fileContents: 'id',
      versions: '++vid, fileId, timestamp',
      files: null, // Delete the old 'files' table
    });
  }
}

export const db = new CodeSyncDB();

const populate = async () => {
    try {
        await db.transaction('rw', db.items, db.fileContents, db.versions, async () => {
          await db.items.bulkAdd(initialItems);
          
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
};


db.on('populate', populate);

// Open the database
db.open().catch(err => {
  console.error(`Failed to open db: ${err.stack || err}`);
});

export async function resetDatabase() {
    await db.transaction('rw', db.items, db.fileContents, db.versions, async () => {
        await Promise.all([
            db.items.clear(),
            db.fileContents.clear(),
            db.versions.clear(),
        ]);
    });
    await populate();
}
