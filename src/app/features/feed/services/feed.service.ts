import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post, InteractionRequest } from '../models/feed.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private http = inject(HttpClient);
  private readonly postsUrl = `${environment.apiUrl}/posts`;
  private readonly interactionsUrl = `${environment.apiUrl}/interactions`;

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.postsUrl);
  }

  interact(postId: number, interactionType: 'LIKE' | 'DISLIKE'): Observable<void> {
    const payload: InteractionRequest = {
      postId,
      interactionType
    };
    return this.http.post<void>(this.interactionsUrl, payload);
  }
}
