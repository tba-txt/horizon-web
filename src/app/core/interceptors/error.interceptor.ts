import { HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      let errorMessage = 'Ocorreu um erro inesperado.';
      
      if (error.error && typeof error.error === 'object') {
        if (error.error.error && typeof error.error.error === 'string') {
          errorMessage = error.error.error;
        } else if (error.error.message && typeof error.error.message === 'string') {
          errorMessage = error.error.message;
        } else if (error.error.errors && Array.isArray(error.error.errors)) {
          errorMessage = error.error.errors.join(', ');
        }
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Dados inválidos. Verifique as informações enviadas.';
            break;
          case 401:
            errorMessage = 'E-mail ou senha incorretos.';
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
