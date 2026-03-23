import type { SchoolLevel, Scenario, ModuleCurrentSetup, PipelineStatus, DMUPosition, PreferredChannel, AuthorityLevel } from '@/models/school';

export interface PriceOverride {
  moduleId: string;
  provider: 'cito' | 'dia' | 'jij';
  amount: number;
}

export interface Contact {
  id: string;
  schoolId: string;
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
  createdBy?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  schoolId: string;
  date: string;
  contactId: string;
  content: string;
  tags: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemEvent {
  id: string;
  schoolId: string;
  timestamp: string;
  eventType: 'pipeline_changed' | 'comparison_created' | 'prices_updated' | 'school_created';
  description: string;
  metadata?: Record<string, string>;
  userId?: string;
}

export interface ActionItem {
  id: string;
  schoolId: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  conversationId: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LostDealInfo {
  competitor: 'dia' | 'jij' | 'overig';
  competitorName?: string;
  reason?: string;
}

export interface SchoolPriceEntry {
  id: string;
  schoolId: string;
  moduleId: string;
  provider: string;
  amount: number;
  priceType: 'publication' | 'agreed';
  discountPercentage: number;
  source: string;
  verifiedAt: string | null;
  note: string;
  isActive: boolean;
  activationReason: string | null;
  activatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolRecord {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
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
  switchingCosts: number;

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

  // Ownership & audit
  ownerId?: string;
  teamId?: string;
  createdBy?: string;
  updatedBy?: string;

  // Joined fields (not stored in DB)
  ownerName?: string;
}
