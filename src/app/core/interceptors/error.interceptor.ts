import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse | any) => {
      // Se a sessão expirou ou o token é inválido em qualquer rota autenticada
      if (error?.status === 401 && !req.url.includes('/auth/login')) {
        authService.logout();
        router.navigate(['/login']);
      }

      let errorMessage = 'Ocorreu um erro inesperado.';
      
      if (error?.error && typeof error.error === 'object') {
        if (error.error.error && typeof error.error.error === 'string') {
          errorMessage = error.error.error;
        } else if (error.error.message && typeof error.error.message === 'string') {
          errorMessage = error.error.message;
        } else if (error.error.errors && Array.isArray(error.error.errors)) {
          errorMessage = error.error.errors.join(', ');
        }
      } else if (typeof error?.error === 'string') {
        errorMessage = error.error;
      } else {
        switch (error?.status) {
          case 400:
            errorMessage = 'Dados inválidos. Verifique as informações enviadas.';
            break;
          case 401:
            errorMessage = req.url.includes('/auth/login') 
              ? 'E-mail ou senha incorretos.' 
              : 'Sessão expirada. Por favor, faça login novamente.';
            break;
          case 403:
            errorMessage = 'Acesso negado.';
            break;
          case 404:
            errorMessage = 'Recurso não encontrado.';
            break;
          case 409:
            errorMessage = 'Conflito de dados.';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
            break;
        }
      }
      
      return throwError(() => new Error(errorMessage));
    })
  );
};
