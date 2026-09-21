import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'destinations', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    redirectTo: 'login'
  },
  {
    path: 'destinations',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/destinations/destination-list/destination-list.component').then(m => m.DestinationListComponent)
      },
      {
        path: 'common',
        loadComponent: () => import('./features/destinations/common-destinations/common-destinations.component').then(m => m.CommonDestinationsComponent)
      },
      {
        path: 'ecotourism',
        loadComponent: () => import('./features/destinations/ecotourism-destinations/ecotourism-destinations.component').then(m => m.EcotourismDestinationsComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/destinations/destination-detail/destination-detail.component').then(m => m.DestinationDetailComponent)
      }
    ]
  },
  {
    path: 'quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./features/quiz/quiz-flow/quiz-flow.component').then(m => m.QuizFlowComponent)
  },
  {
    path: 'feed',
    canActivate: [authGuard],
    loadComponent: () => import('./features/feed/feed-main/feed-main.component').then(m => m.FeedMainComponent)
  },
  {
    path: 'recommendations',
    canActivate: [authGuard],
    loadComponent: () => import('./features/recommendations/recommendations-list/recommendations-list.component').then(m => m.RecommendationsListComponent)
  },
  {
    path: 'flights',
    canActivate: [authGuard],
    loadComponent: () => import('./features/flights/flight-search/flight-search.component').then(m => m.FlightSearchComponent)
  },
  { path: '**', redirectTo: 'destinations' }
];
