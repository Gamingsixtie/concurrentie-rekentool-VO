import Dexie, { type EntityTable } from 'dexie';
import type { SchoolRecord } from './types';

class RekenToolDB extends Dexie {
  schools!: EntityTable<SchoolRecord, 'id'>;

  constructor() {
    super('rekentool-vo');
    this.version(1).stores({
      schools: '++id, slug, name, updatedAt',
    });
  }
}

export const db = new RekenToolDB();
export { RekenToolDB };
