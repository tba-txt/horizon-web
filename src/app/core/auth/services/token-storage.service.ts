import { Injectable } from '@angular/core';

const TOKEN_KEY = 'horizon_auth_token';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  public saveToken(token: string): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, token);
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}
