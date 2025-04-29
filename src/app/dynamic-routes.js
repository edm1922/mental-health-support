// This file is used to configure dynamic routes for the app
export const dynamicRoutes = [
  '/admin/dashboard',
  '/admin/counselor-applications',
  '/admin/fix-database',
  '/book-session',
  '/checkin',
  '/community',
  '/counselor/dashboard',
  '/mental-health-checkin',
  '/new-page',
  '/profile',
  '/apply/counselor',
];

// Export configuration for Next.js
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
