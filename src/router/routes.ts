import {
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { db } from '@/db/database';
import { checkSchoolExists } from './guards';

// Root layout
export const rootRoute = createRootRoute({
  component: () => Outlet({}),
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
          to: '/scholen/$slug/wizard/$step',
          params: { slug: first.slug, step: '1' },
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
});

// Wizard step
export const wizardStepRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/wizard/$step',
});

// Price comparison
export const vergelijkingRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/vergelijking',
});

// Current vs proposed
export const huidigVsCitoRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/huidig-vs-cito',
});

// Migration
export const migratieRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/migratie',
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  scholenRoute,
  schoolRoute.addChildren([
    wizardStepRoute,
    vergelijkingRoute,
    huidigVsCitoRoute,
    migratieRoute,
  ]),
]);
