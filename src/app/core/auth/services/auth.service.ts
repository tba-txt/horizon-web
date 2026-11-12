import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest
} from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';
import { UserService } from '../../user/services/user.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private userService = inject(UserService);
  
  private readonly apiUrl = environment.apiUrl;

  public isLoggedIn = signal<boolean>(!!this.tokenStorage.getToken());

  public isAuthenticated(): boolean {
    const hasToken = !!this.tokenStorage.getToken();
    if (this.isLoggedIn() !== hasToken) {
      this.isLoggedIn.set(hasToken);
    }
    return hasToken;
  }

  public login(credentials: LoginRequest, rememberMe: boolean = true): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response?.token) {
          this.tokenStorage.saveToken(response.token, rememberMe);
          const chosenName = response.socialName?.trim() || response.name?.trim();
          if (chosenName) {
            localStorage.setItem('horizon_user_name', chosenName);
          }
          this.isLoggedIn.set(true);
          this.userService.loadProfileIfNeeded(true);
        }
      })
    );
  }

  public loginWithGoogle(idToken: string, rememberMe: boolean = true): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/google`, { idToken }).pipe(
      tap(response => {
        if (response?.token) {
          this.tokenStorage.saveToken(response.token, rememberMe);
          const chosenName = response.socialName?.trim() || response.name?.trim();
          if (chosenName) {
            localStorage.setItem('horizon_user_name', chosenName);
          }
          this.isLoggedIn.set(true);
          this.userService.loadProfileIfNeeded(true);
        }
      })
    );
  }

  public register(data: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(response => {
        if (response?.id) {
          this.tokenStorage.clearNewUserLocalCache(response.id);
        }
      })
    );
  }

  public forgotPassword(data: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/forgot-password`, data);
  }

  public resetPassword(data: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/reset-password`, data);
  }

  public logout(): void {
    this.tokenStorage.clearStorage();
    this.userService.clearUser();
    this.isLoggedIn.set(false);
  }
}
