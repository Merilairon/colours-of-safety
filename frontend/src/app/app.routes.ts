import { Routes } from '@angular/router';
import { authGuard, reviewerGuard, adminGuard } from './core/guards';
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
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password').then((m) => m.ForgotPasswordComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Reset Password | Colours of Safety',
      description: 'Request a link to reset your Colours of Safety password.',
      robots: 'noindex,nofollow',
    },
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password').then((m) => m.ResetPasswordComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Choose a New Password | Colours of Safety',
      description: 'Choose a new password for your Colours of Safety account.',
      robots: 'noindex,nofollow',
    },
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./auth/email-link').then((m) => m.EmailLinkComponent),
    resolve: { seo: seoResolver },
    data: {
      mode: 'verify',
      title: 'Confirm Email | Colours of Safety',
      description: 'Confirm the email address for your Colours of Safety account.',
      robots: 'noindex,nofollow',
    },
  },
  {
    path: 'confirm-email',
    loadComponent: () => import('./auth/email-link').then((m) => m.EmailLinkComponent),
    resolve: { seo: seoResolver },
    data: {
      mode: 'email-change',
      title: 'Confirm New Email | Colours of Safety',
      description: 'Confirm the new email address for your Colours of Safety account.',
      robots: 'noindex,nofollow',
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
    path: 'my-edits',
    canActivate: [authGuard],
    loadComponent: () => import('./submissions/my-edits/my-edits').then((m) => m.MyEditsComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'My Edits | Colours of Safety',
      description: 'Track your proposed edits to existing places and districts.',
      robots: 'noindex,nofollow',
    },
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./profile/profile').then((m) => m.ProfileComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Profile | Colours of Safety',
      description: 'Manage your profile, password, email, and account settings.',
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
  {
    path: 'privacy',
    loadComponent: () => import('./privacy/privacy.component').then((m) => m.PrivacyComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Privacy Policy | Colours of Safety',
      description: 'Privacy Policy for Colours of Safety - how we handle your data.',
    },
  },
  {
    path: 'faq',
    loadComponent: () => import('./faq/faq').then((m) => m.FaqComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'FAQ | Colours of Safety',
      description: 'Frequently asked questions about finding and submitting LGBTQIA+ safe spaces.',
      keywords: 'FAQ, LGBTQ safe spaces help, community moderation, safety ratings explained',
    },
  },
  {
    path: 'place/:id',
    loadComponent: () => import('./place/place').then((m) => m.PlaceComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Safe Space Details | Colours of Safety',
      description: 'View detailed information about this queer-friendly safe space.',
    },
  },
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found').then((m) => m.NotFoundComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Page Not Found | Colours of Safety',
      description: 'The page you were looking for does not exist.',
      robots: 'noindex,nofollow',
    },
  },
];
