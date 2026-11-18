import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false, standalone: true, title: 'Sign In' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Dashboard' },
  },
  {
    path: '/milk-arrival',
    name: 'MilkArrival',
    component: () => import('@/views/milk/MilkArrivalView.vue'),
    meta: { requiresAuth: true, title: 'Milk Arrival' },
  },
  {
    path: '/milk-dispatch',
    name: 'MilkDispatch',
    component: () => import('@/views/dispatch/MilkDispatchView.vue'),
    meta: { requiresAuth: true, title: 'Milk Dispatch' },
  },
  {
    path: '/day-closing',
    name: 'DayClosing',
    component: () => import('@/views/dispatch/DayClosingView.vue'),
    meta: { requiresAuth: true, title: 'Day Closing' },
  },
  {
    path: '/masters',
    name: 'Masters',
    component: () => import('@/views/masters/MastersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, title: 'Masters & Fleet' },
  },
  {
    path: '/masters/vehicles',
    redirect: { path: '/masters', query: { tab: 'vehicles' } },
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/masters/drivers',
    redirect: { path: '/masters', query: { tab: 'employees', role: 'driver' } },
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/masters/calanders',
    redirect: { path: '/masters', query: { tab: 'employees', role: 'calander' } },
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/masters/calenders',
    redirect: { path: '/masters', query: { tab: 'employees', role: 'calander' } },
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/masters/areas',
    redirect: { path: '/masters', query: { tab: 'areas' } },
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/masters/shops',
    redirect: { path: '/masters', query: { tab: 'shops' } },
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/masters/milk-price',
    redirect: { path: '/masters', query: { tab: 'shops' } },
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/masters/dispatches',
    redirect: { path: '/masters', query: { tab: 'dispatches' } },
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/employees',
    name: 'Employees',
    component: () => import('@/views/employees/EmployeesView.vue'),
    meta: { requiresAuth: true, title: 'Staff & Payroll' },
  },
  {
    path: '/employees/attendance',
    redirect: { path: '/employees', query: { tab: 'attendance' } },
  },
  {
    path: '/employees/advances',
    redirect: { path: '/employees', query: { tab: 'advances' } },
  },
  {
    path: '/employees/salaries',
    redirect: { path: '/employees', query: { tab: 'salaries' } },
  },
  {
    path: '/employees/record',
    redirect: { path: '/employees', query: { tab: 'record' } },
  },
  {
    path: '/expenses',
    name: 'Expenses',
    component: () => import('@/views/expenses/ExpensesView.vue'),
    meta: { requiresAuth: true, title: 'Expenses' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/SettingsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, title: 'Settings' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: false, title: 'Page Not Found' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  // Ensure auth state is initialized from storage if not already
  if (!authStore.user) {
    authStore.initAuth();
  }

  const isAuthenticated = authStore.isAuthenticated;
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);

  // Update page title - display only the page title, fallback to DMS
  document.title = to.meta.title || 'DMS';

  // If not authenticated: user MUST login first. No other part of the app is accessible.
  if (!isAuthenticated) {
    if (to.path !== '/login') {
      const hasSpecificRedirect = to.fullPath && to.fullPath !== '/' && to.fullPath !== '/dashboard';
      return next({ path: '/login', query: hasSpecificRedirect ? { redirect: to.fullPath } : {} });
    }
    return next();
  }

  // If already authenticated and trying to visit /login, redirect to /dashboard
  if (to.path === '/login') {
    return next({ path: '/dashboard' });
  }

  // Admin-only route guard (e.g., Settings)
  if (requiresAdmin && !authStore.isAdmin) {
    return next({ path: '/dashboard' });
  }

  // Settings & Users is desktop-only (hidden for both admin and staff on mobile)
  if (to.path.startsWith('/settings') && typeof window !== 'undefined' && window.innerWidth <= 960) {
    return next({ path: '/dashboard' });
  }

  next();
});

export default router;
