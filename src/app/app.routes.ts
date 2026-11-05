import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'destinations', pathMatch: 'full' },
  {
    path: 'login',
    title: 'Entrar | Horizon',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    title: 'Cadastre-se | Horizon',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    title: 'Recuperar senha | Horizon',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    title: 'Redefinir senha | Horizon',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'destinations',
    children: [
      {
        path: '',
        title: 'Destinos | Horizon',
        loadComponent: () => import('./features/destinations/destination-list/destination-list.component').then(m => m.DestinationListComponent)
      },
      {
        path: 'common',
        title: 'Destinos populares | Horizon',
        loadComponent: () => import('./features/destinations/common-destinations/common-destinations.component').then(m => m.CommonDestinationsComponent)
      },
      {
        path: 'ecotourism',
        title: 'Ecoturismo | Horizon',
        loadComponent: () => import('./features/destinations/ecotourism-destinations/ecotourism-destinations.component').then(m => m.EcotourismDestinationsComponent)
      },
      {
        path: ':id',
        title: 'Detalhes do destino | Horizon',
        loadComponent: () => import('./features/destinations/destination-detail/destination-detail.component').then(m => m.DestinationDetailComponent)
      }
    ]
  },
  {
    path: 'quiz',
    title: 'Quiz de viagem | Horizon',
    loadComponent: () => import('./features/quiz/quiz-flow/quiz-flow.component').then(m => m.QuizFlowComponent)
  },
  {
    path: 'feed',
    title: 'Feed | Horizon',
    loadComponent: () => import('./features/feed/feed-main/feed-main.component').then(m => m.FeedMainComponent)
  },
  {
    path: 'recommendations',
    title: 'Recomendações | Horizon',
    canActivate: [authGuard],
    loadComponent: () => import('./features/recommendations/recommendations-list/recommendations-list.component').then(m => m.RecommendationsListComponent)
  },
  {
    path: 'flights',
    title: 'Voos | Horizon',
    loadComponent: () => import('./features/flights/flight-search/flight-search.component').then(m => m.FlightSearchComponent)
  },
  {
    path: 'faq',
    title: 'Perguntas frequentes | Horizon',
    loadComponent: () => import('./features/faq/faq.component').then(m => m.FaqComponent)
  },
  {
    path: 'profile',
    title: 'Minha conta | Horizon',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'checkout',
    title: 'Reserva | Horizon',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'checkout/:id',
    title: 'Reserva | Horizon',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'accessibility',
    title: 'Acessibilidade | Horizon',
    loadComponent: () => import('./features/accessibility/accessibility-page.component').then(m => m.AccessibilityPageComponent)
  },
  { path: '**', redirectTo: 'destinations' }
];
