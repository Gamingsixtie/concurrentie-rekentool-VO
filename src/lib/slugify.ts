import slugifyLib from 'slugify';
import { supabase } from '@/lib/supabase/client';

export function generateSlug(name: string): string {
  return slugifyLib(name, { lower: true, strict: true, locale: 'nl' });
}

export async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = generateSlug(name);
  if (!base) return '';
  let candidate = base;
  let counter = 1;
  while (true) {
    const { data } = await supabase.from('schools').select('id').eq('slug', candidate).maybeSingle();
    const existing = data !== null;
    if (!existing || (data && data.id === excludeId)) return candidate;
    counter++;
    candidate = `${base}-${counter}`;
  }
}
