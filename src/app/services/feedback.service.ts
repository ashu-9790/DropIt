import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../config';

export interface Feedback {
  _id?: string;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface FeedbackResponse {
  success: boolean;
  data: Feedback | Feedback[];
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  submitFeedback(feedback: { name: string; rating: number; comment: string }): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(
      `${this.apiBaseUrl}/api/feedback`,
      feedback
    ).pipe(
      catchError(this.handleError)
    );
  }

  getRecentFeedback(limit: number = 5): Observable<FeedbackResponse> {
    return this.http.get<FeedbackResponse>(
      `${this.apiBaseUrl}/api/feedback/recent?limit=${limit}`
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.error || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
