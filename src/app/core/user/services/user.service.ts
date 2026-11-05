import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserProfile, UserUpdateRequest } from '../models/user.model';

const USER_PROFILE_KEY = 'horizon_user_profile';
const USER_NAME_KEY = 'horizon_user_name';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  public currentUser = signal<UserProfile | null>(this.getInitialCachedProfile());

  private getInitialCachedProfile(): UserProfile | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const saved = localStorage.getItem(USER_PROFILE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  private cacheUser(profile: UserProfile): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      const displayName = profile.socialName?.trim() || profile.name?.trim() || '';
      if (displayName) {
        localStorage.setItem(USER_NAME_KEY, displayName);
      }
    } catch {}
  }

  public clearUser(): void {
    this.currentUser.set(null);
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(USER_PROFILE_KEY);
      localStorage.removeItem(USER_NAME_KEY);
    } catch {}
  }

  public loadProfileIfNeeded(): void {
    if (this.currentUser()) return;
    this.getProfile().subscribe({
      error: () => {}
    });
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/me`).pipe(
      tap(profile => {
        this.currentUser.set(profile);
        this.cacheUser(profile);
      })
    );
  }

  updateProfile(request: UserUpdateRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/me`, request).pipe(
      tap(profile => {
        this.currentUser.set(profile);
        this.cacheUser(profile);
      })
    );
  }

  deactivateAccount(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/me/deactivate`).pipe(
      tap(() => this.clearUser())
    );
  }

  uploadProfilePicture(file: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UserProfile>(`${this.baseUrl}/me/profile-picture`, formData).pipe(
      tap(profile => {
        this.currentUser.set(profile);
        this.cacheUser(profile);
      })
    );
  }

  changePassword(request: { currentPassword: string; newPassword: string; confirmPassword: string }): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/me/password`, request);
  }
}
