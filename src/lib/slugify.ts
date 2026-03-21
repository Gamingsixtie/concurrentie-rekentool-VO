import slugifyLib from 'slugify';
import { db } from '@/db/database';

export function generateSlug(name: string): string {
  return slugifyLib(name, { lower: true, strict: true, locale: 'nl' });
}

export async function uniqueSlug(name: string, excludeId?: number): Promise<string> {
  const base = generateSlug(name);
  if (!base) return '';
  let candidate = base;
  let counter = 1;
  while (true) {
    const existing = await db.schools.where('slug').equals(candidate).first();
    if (!existing || existing.id === excludeId) return candidate;
    counter++;
    candidate = `${base}-${counter}`;
  }
}
