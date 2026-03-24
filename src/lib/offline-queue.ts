import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PendingMutation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  timestamp: number;
  conflicted?: boolean;
  conflictReason?: string;
}

interface OfflineQueueState {
  mutations: PendingMutation[];
  addMutation: (mutation: Omit<PendingMutation, 'id' | 'timestamp'>) => void;
  removeMutation: (id: string) => void;
  clearAll: () => void;
  syncAll: () => Promise<{ synced: number; conflicts: number }>;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      mutations: [],

      addMutation: (mutation) => {
        const entry: PendingMutation = {
          ...mutation,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        set((state) => ({ mutations: [...state.mutations, entry] }));
      },

      removeMutation: (id) => {
        set((state) => ({ mutations: state.mutations.filter((m) => m.id !== id) }));
      },

      clearAll: () => set({ mutations: [] }),

      syncAll: async () => {
        const { mutations } = get();
        if (mutations.length === 0) return { synced: 0, conflicts: 0 };

        // Import supabase client dynamically to avoid circular deps
        const { supabase } = await import('@/lib/supabase/client');

        let synced = 0;
        let conflicts = 0;

        for (const mutation of mutations) {
          try {
            // --- CONFLICT DETECTION ---
            // For updates: check if server record was modified after our mutation was queued
            if (mutation.operation === 'update' && mutation.payload.id) {
              // Use generic query — table name is dynamic, not all tables have updated_at
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: serverRow } = await (supabase as any)
                .from(mutation.table)
                .select('updated_at')
                .eq('id', mutation.payload.id as string)
                .single();

              const updatedAt = (serverRow as Record<string, unknown> | null)?.updated_at;
              if (updatedAt) {
                const serverUpdatedAt = new Date(updatedAt as string).getTime();
                if (serverUpdatedAt > mutation.timestamp) {
                  // SERVER WINS: mark as conflicted, do NOT apply the mutation
                  set((state) => ({
                    mutations: state.mutations.map((m) =>
                      m.id === mutation.id
                        ? { ...m, conflicted: true, conflictReason: `Server bijgewerkt op ${new Date(serverUpdatedAt).toLocaleString('nl-NL')}` }
                        : m,
                    ),
                  }));
                  conflicts++;
                  continue; // Skip this mutation
                }
              }
            }

            // --- APPLY MUTATION ---
            // Table name is dynamic — use generic Supabase calls
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const table = (supabase as any).from(mutation.table);
            switch (mutation.operation) {
              case 'insert':
                await table.insert(mutation.payload as never);
                break;
              case 'update': {
                const { id: rowId, ...rest } = mutation.payload;
                await table.update(rest as never).eq('id', rowId as string);
                break;
              }
              case 'delete':
                await table.delete().eq('id', mutation.payload.id as string);
                break;
            }
            // Remove successful mutation
            set((state) => ({
              mutations: state.mutations.filter((m) => m.id !== mutation.id),
            }));
            synced++;
          } catch (error) {
            console.error(`Sync failed for mutation ${mutation.id}:`, error);
            // Keep failed mutations in queue for retry
          }
        }
        return { synced, conflicts };
      },
    }),
    { name: 'offline-queue' },
  ),
);
