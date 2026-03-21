import {
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { db } from '@/db/database';
import { checkSchoolExists } from './guards';
import SchoolLayout from '@/components/routing/SchoolLayout';
import WizardPage from '@/components/routing/WizardPage';
import { CurrentVsProposedPage } from '@/features/price-comparison/CurrentVsProposedPage';
import { MigrationPage } from '@/features/price-comparison/MigrationPage';
import SchoolOverviewPage from '@/features/school-overview/SchoolOverviewPage';
import DashboardTab from '@/features/school-profile/tabs/DashboardTab';
import ComparisonTab from '@/features/school-profile/tabs/ComparisonTab';
import ProductsTab from '@/features/school-profile/tabs/ProductsTab';
import ContactsTab from '@/features/school-profile/tabs/ContactsTab';
import ConversationsTab from '@/features/school-profile/tabs/ConversationsTab';

// Root layout
export const rootRoute = createRootRoute({
  component: Outlet,
});

// Index route — smart redirect based on school count
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    const count = await db.schools.count();
    if (count === 1) {
      const first = await db.schools.toCollection().first();
      if (first) {
        throw redirect({
          to: '/scholen/$slug',
          params: { slug: first.slug },
        });
      }
    }
    throw redirect({ to: '/scholen' });
  },
});

// School overview
export const scholenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scholen',
  component: SchoolOverviewPage,
});

// School layout (parent for all school-specific routes)
export const schoolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scholen/$slug',
  beforeLoad: async ({ params }) => {
    const school = await checkSchoolExists(params.slug);
    if (!school) {
      throw redirect({
        to: '/scholen',
        search: { error: 'not-found' },
      });
    }
    return { school };
  },
  component: SchoolLayout,
});

// Dashboard (index route for school profile)
export const schoolDashboardRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/',
  component: DashboardTab,
});

// Wizard step
export const wizardStepRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/wizard/$step',
  component: WizardPage,
});

// Price comparison (also accessible as tab via ComparisonTab)
export const vergelijkingRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/vergelijking',
  component: ComparisonTab,
});

// Current vs proposed
export const huidigVsCitoRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/huidig-vs-cito',
  component: CurrentVsProposedPage,
});

// Migration
export const migratieRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/migratie',
  component: MigrationPage,
});

// Products tab
export const schoolProductsRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/producten',
  component: ProductsTab,
});

// Contacts tab
export const schoolContactsRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/contacten',
  component: ContactsTab,
});

// Conversations tab
export const schoolConversationsRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/gesprekken',
  component: ConversationsTab,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  scholenRoute,
  schoolRoute.addChildren([
    schoolDashboardRoute,
    wizardStepRoute,
    vergelijkingRoute,
    huidigVsCitoRoute,
    migratieRoute,
    schoolProductsRoute,
    schoolContactsRoute,
    schoolConversationsRoute,
  ]),
]);
