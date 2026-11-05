import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
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
      console.log(`[FeedService] Buscando posts da API (${this.postsUrl}) para userId=${currentUserId}, forceRefresh=${forceRefresh}`);
      this.cachedUserId = currentUserId;
      this.cachedPosts$ = this.http.get<Post[]>(this.postsUrl).pipe(
        tap({
          next: (posts) => console.log(`[FeedService] Recebidos ${posts?.length ?? 0} posts da API`),
          error: (err) => console.error('[FeedService] Erro ao buscar posts da API:', err)
        }),
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
    console.log(`[FeedService] Enviando interação para ${this.interactionsUrl}:`, payload);
    return this.http.post<void>(this.interactionsUrl, payload).pipe(
      tap({
        next: () => console.log(`[FeedService] Interação postId=${postId} (${interactionType}) confirmada com sucesso`),
        error: (err) => console.error(`[FeedService] Erro ao registrar interação postId=${postId}:`, err)
      })
    );
  }

  clearCache(): void {
    console.log('[FeedService] Cache de posts limpo.');
    this.cachedPosts$ = undefined;
    this.cachedUserId = null;
  }
}
