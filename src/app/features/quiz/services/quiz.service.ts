import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quiz, SubmitQuizRequest } from '../models/quiz.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/quizzes`;

  getActiveQuiz(): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.apiUrl}/active`);
  }

  submitQuiz(quizId: number | null, payload: SubmitQuizRequest): Observable<void> {
    const url = quizId ? `${this.apiUrl}/${quizId}/submit` : `${this.apiUrl}/submit`;
    return this.http.post<void>(url, payload);
  }
}
