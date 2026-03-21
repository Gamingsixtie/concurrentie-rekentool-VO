import type { SchoolLevel, Scenario, ModuleCurrentSetup, PipelineStatus, DMUPosition, PreferredChannel, AuthorityLevel } from '@/models/school';

export interface PriceOverride {
  moduleId: string;
  provider: 'cito' | 'dia' | 'jij';
  amount: number;
}

export interface Contact {
  id: string;
  name: string;
  dmuPosition: DMUPosition;
  jobTitle: string;
  email: string;
  phone: string;
  preferredChannel: PreferredChannel;
  authority: AuthorityLevel;
  lastContactDate: string | null;
  notes: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  date: string;
  contactId: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemEvent {
  id: string;
  timestamp: string;
  eventType: 'pipeline_changed' | 'comparison_created' | 'prices_updated' | 'school_created';
  description: string;
  metadata?: Record<string, string>;
}

export interface ActionItem {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LostDealInfo {
  competitor: 'dia' | 'jij' | 'overig';
  competitorName?: string;
  reason?: string;
}

export interface SchoolRecord {
  id?: number;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isComplete: boolean;
  completedSteps: number[];

  // Wizard data
  levels: SchoolLevel[];
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>;
  selectedModules: string[];
  moduleSetups: ModuleCurrentSetup[];
  scenario: Scenario | null;

  // Price comparison data
  appliedOverrides: PriceOverride[];
  migrationHourlyRate: number;
  migrationTimeSavingOverrides: Record<string, number>;

  // CRM-lite data
  contacts: Contact[];
  conversations: Conversation[];
  actions: ActionItem[];
  systemEvents: SystemEvent[];
  pipelineStatus: PipelineStatus;
  lostDealInfo?: LostDealInfo;
  region: string;
  tags: string[];
  viewPreference: 'compact' | 'extended';
}
