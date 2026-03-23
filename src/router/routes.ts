import {
  createRootRoute,
  createRoute,
  redirect,
} from '@tanstack/react-router';
import { checkSchoolExists } from './guards';
import RootLayout from '@/components/routing/RootLayout';
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
import WaardeTab from '@/features/school-profile/tabs/WaardeTab';
import SchoolplanTab from '@/features/school-profile/tabs/SchoolplanTab';
import { LoginPage } from '@/features/auth/LoginPage';

// Root layout (with UserMenu header and migration gate)
export const rootRoute = createRootRoute({
  component: RootLayout,
});

// Login route — outside ProtectedRoute
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Index route — smart redirect to overview
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
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

// Waarde tab
export const waardeRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/waarde',
  component: WaardeTab,
});

// Schoolplan tab
export const schoolplanRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/schoolplan',
  component: SchoolplanTab,
});

export const routeTree = rootRoute.addChildren([
  loginRoute,
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
    waardeRoute,
    schoolplanRoute,
  ]),
]);
