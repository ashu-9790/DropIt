import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from './config';

export type Vibe = 'Roast' | 'Toast';
export type Language = 'English' | 'Hindi' | 'Marathi';

export interface GenerateMessageRequest {
  creator_name: string;
  recipient_name: string;
  quirks: string;
  vibe: Vibe;
  language: Language;
}

export interface GenerateMessageResponse {
  success: boolean;
  share_id: string;
  generation?: {
    source: string;
    model: string;
  };
}

export interface MessageContent {
  title: string;
  body: string;
}

export interface MessagePayload {
  vibe: Vibe;
  recipient: string;
  language?: Language;
  content: MessageContent;
  generation?: {
    source: string;
    model: string;
  };
  stats?: {
    views: number;
    shares: number;
  };
}

export interface MessageResponse {
  success: boolean;
  data: MessagePayload;
}

export interface StatsResponse {
  success: boolean;
  data: {
    totalMessages: number;
    totalViews: number;
    totalShares: number;
    roastCount: number;
    toastCount: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  generateMessage(
    payload: GenerateMessageRequest,
  ): Observable<GenerateMessageResponse> {
    return this.http.post<GenerateMessageResponse>(
      `${this.apiBaseUrl}/api/generate`,
      payload,
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getMessage(shareId: string): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(
      `${this.apiBaseUrl}/api/message/${shareId}`,
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  recordShare(shareId: string): Observable<{ success: boolean; shares: number }> {
    return this.http.post<{ success: boolean; shares: number }>(
      `${this.apiBaseUrl}/api/message/${shareId}/share`,
      {},
    ).pipe(
      catchError(this.handleError)
    );
  }

  getStats(): Observable<StatsResponse> {
    return this.http.get<StatsResponse>(
      `${this.apiBaseUrl}/api/stats`,
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else if (error.status) {
      // Server-side error
      if (error.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.status === 400) {
        errorMessage = error.error?.error || 'Invalid request';
      } else if (error.status === 404) {
        errorMessage = 'Message not found';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.error?.error || `HTTP Error: ${error.status}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
