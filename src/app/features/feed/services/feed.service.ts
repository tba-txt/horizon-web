import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Post } from '../models/feed.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private http = inject(HttpClient);
  private readonly postsUrl = `${environment.apiUrl}/posts`;
  private readonly interactionsUrl = `${environment.apiUrl}/interactions`;

  getPosts(_forceRefresh = false): Observable<Post[]> {
    return this.http.get<Post[]>(this.postsUrl);
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

  clearCache(): void {}
}
