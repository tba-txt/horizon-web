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
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'destinations',
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
    loadComponent: () => import('./features/quiz/quiz-flow/quiz-flow.component').then(m => m.QuizFlowComponent)
  },
  {
    path: 'feed',
    loadComponent: () => import('./features/feed/feed-main/feed-main.component').then(m => m.FeedMainComponent)
  },
  {
    path: 'recommendations',
    canActivate: [authGuard],
    loadComponent: () => import('./features/recommendations/recommendations-list/recommendations-list.component').then(m => m.RecommendationsListComponent)
  },
  {
    path: 'flights',
    loadComponent: () => import('./features/flights/flight-search/flight-search.component').then(m => m.FlightSearchComponent)
  },
  {
    path: 'faq',
    loadComponent: () => import('./features/faq/faq.component').then(m => m.FaqComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'checkout/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  { path: '**', redirectTo: 'destinations' }
];
