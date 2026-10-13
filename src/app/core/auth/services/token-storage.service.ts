import { Injectable } from '@angular/core';

const TOKEN_KEY = 'horizon_auth_token';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  
  public saveToken(token: string, rememberMe: boolean = true): void {
    this.clearStorage();
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  public isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp) return false;
      return payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  public getToken(): string | null {
    // Tenta pegar primeiro da session, depois do local
    const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    
    if (!token) return null;

    if (this.isTokenExpired(token)) {
      this.clearStorage();
      return null;
    }

    return token;
  }

  public getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.sub ? String(payload.sub) : null;
    } catch {
      return null;
    }
  }

  public clearStorage(): void {
    // Obter o token bruto diretamente para não acionar getToken() e causar loop infinito
    const rawToken = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (rawToken) {
      try {
        const parts = rawToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.sub) {
            localStorage.removeItem(`thisOrThatSelection_${payload.sub}`);
          }
        }
      } catch {}
    }
    localStorage.removeItem('thisOrThatSelection');
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

