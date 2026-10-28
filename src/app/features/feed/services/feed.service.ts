import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Post } from '../models/feed.model';
import { environment } from '../../../../environments/environment';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private readonly postsUrl = `${environment.apiUrl}/posts`;
  private readonly interactionsUrl = `${environment.apiUrl}/interactions`;

  private cachedPosts$?: Observable<Post[]>;
  private cachedUserId: string | null = null;

  getPosts(forceRefresh = false): Observable<Post[]> {
    const currentUserId = this.tokenStorage.getUserId() ?? 'guest';
    if (!this.cachedPosts$ || forceRefresh || this.cachedUserId !== currentUserId) {
      this.cachedUserId = currentUserId;
      this.cachedPosts$ = this.http.get<Post[]>(this.postsUrl).pipe(
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.cachedPosts$;
  }

  interact(postId: number, interactionType: 'LIKE' | 'DISLIKE' | 'VOTE' | 'UNVOTE' | 'UNLIKE' | 'UNDISLIKE', optionId?: number): Observable<void> {
    const payload: any = {
      postId,
      interactionType
    };
    if (optionId) {
      payload.optionId = optionId;
    }
    return this.http.post<void>(this.interactionsUrl, payload);
  }

  clearCache(): void {
    this.cachedPosts$ = undefined;
    this.cachedUserId = null;
  }
}
