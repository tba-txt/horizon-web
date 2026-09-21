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
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  
  private readonly apiUrl = environment.apiUrl;

  public isLoggedIn = signal<boolean>(!!this.tokenStorage.getToken());

  public login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response?.token) {
          this.tokenStorage.saveToken(response.token);
          this.isLoggedIn.set(true);
        }
      })
    );
  }

  public register(data: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, data);
  }

  public forgotPassword(data: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/forgot-password`, data);
  }

  public resetPassword(data: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/reset-password`, data);
  }

  public logout(): void {
    this.tokenStorage.clearStorage();
    this.isLoggedIn.set(false);
  }
}
