import { Routes } from '@angular/router';
import { authGuard, reviewerGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./map/map').then((m) => m.MapComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'mine',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./submissions/my-submissions').then(
        (m) => m.MySubmissionsComponent,
      ),
  },
  {
    path: 'review',
    canActivate: [reviewerGuard],
    loadComponent: () =>
      import('./review/review').then((m) => m.ReviewComponent),
  },
  { path: '**', redirectTo: '' },
];
