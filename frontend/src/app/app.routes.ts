import { Routes } from '@angular/router';
import { authGuard, reviewerGuard } from './core/guards';
import { adminGuard } from './core/guards';
import { seoResolver } from './core/seo.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./map/map').then((m) => m.MapComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Colours of Safety | Find Queer-Friendly Safe Spaces',
      description:
        'Community-driven map of LGBTQIA+ friendly places and safe districts. Browse approved safe spaces worldwide.',
      keywords: 'queer friendly, LGBTQ safe spaces, gay friendly map, trans friendly places',
    },
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login').then((m) => m.LoginComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Login | Colours of Safety',
      description: 'Sign in to submit queer-friendly places and track your contributions.',
    },
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register').then((m) => m.RegisterComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Join | Colours of Safety',
      description: 'Create an account to contribute safe space locations to our community map.',
    },
  },
  {
    path: 'mine',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./submissions/my-submissions').then((m) => m.MySubmissionsComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'My Submissions | Colours of Safety',
      description: 'Track your submitted queer-friendly places and review status.',
      robots: 'noindex,nofollow',
    },
  },
  {
    path: 'review',
    canActivate: [reviewerGuard],
    loadComponent: () => import('./review/review').then((m) => m.ReviewComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Review Queue | Colours of Safety',
      description: 'Moderator review queue for community submissions.',
      robots: 'noindex,nofollow',
    },
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin.component').then((m) => m.AdminComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Admin | Colours of Safety',
      description: 'Admin panel for user management.',
      robots: 'noindex,nofollow',
    },
  },
  { path: '**', redirectTo: '' },
];
