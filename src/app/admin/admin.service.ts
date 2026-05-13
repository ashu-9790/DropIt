import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../config';

export interface AdminStats {
  totalMessages: number;
  messagesToday: number;
  totalViews: number;
  totalShares: number;
  roastCount: number;
  toastCount: number;
  roastPercentage: number;
  toastPercentage: number;
  languageDistribution: Array<{ language: string; count: number }>;
}

export interface Message {
  shareId: string;
  vibe: string;
  tone: string;
  language: string;
  title: string;
  views: number;
  shares: number;
  createdAt: string;
  creatorName?: string;
  recipientName?: string;
}

export interface SystemSettings {
  features: {
    roastEnabled: boolean;
    toastEnabled: boolean;
    maintenanceMode: boolean;
  };
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  cache: {
    enabled: boolean;
    ttlSeconds: number;
  };
  ai: {
    model: string;
    fallbackEnabled: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;
  
  private tokenSubject = new BehaviorSubject<string | null>(this.getToken());
  public token$ = this.tokenSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(!!this.getToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {}

  private getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('admin_token', token);
    this.tokenSubject.next(token);
    this.isAuthenticatedSubject.next(true);
  }

  private clearToken(): void {
    localStorage.removeItem('admin_token');
    this.tokenSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  // Authentication
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/admin/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.success && response.token) {
          this.setToken(response.token);
        }
      })
    );
  }

  logout(): void {
    this.clearToken();
  }

  verifyToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/admin/verify`, {
      headers: this.getHeaders()
    });
  }

  // Stats & Analytics
  getStats(): Observable<{ success: boolean; data: AdminStats }> {
    return this.http.get<{ success: boolean; data: AdminStats }>(
      `${this.apiUrl}/api/admin/stats`,
      { headers: this.getHeaders() }
    );
  }

  getMessages(page = 1, limit = 50, filters?: any): Observable<any> {
    let params = `?page=${page}&limit=${limit}`;
    if (filters?.vibe) params += `&vibe=${filters.vibe}`;
    if (filters?.language) params += `&language=${filters.language}`;
    if (filters?.startDate) params += `&startDate=${filters.startDate}`;
    if (filters?.endDate) params += `&endDate=${filters.endDate}`;

    return this.http.get(`${this.apiUrl}/api/admin/messages${params}`, {
      headers: this.getHeaders()
    });
  }

  getAnalytics(days = 30): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/admin/analytics?days=${days}`, {
      headers: this.getHeaders()
    });
  }

  getTopMessages(type: 'views' | 'shares' = 'views', limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/admin/top-messages?type=${type}&limit=${limit}`, {
      headers: this.getHeaders()
    });
  }

  getPerformance(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/admin/performance`, {
      headers: this.getHeaders()
    });
  }

  // Moderation
  deleteMessage(shareId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/admin/message/${shareId}`, {
      headers: this.getHeaders()
    });
  }

  bulkDeleteMessages(shareIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/admin/messages/bulk-delete`, 
      { shareIds },
      { headers: this.getHeaders() }
    );
  }

  // Settings
  getSettings(): Observable<{ success: boolean; data: SystemSettings }> {
    return this.http.get<{ success: boolean; data: SystemSettings }>(
      `${this.apiUrl}/api/admin/settings`,
      { headers: this.getHeaders() }
    );
  }

  updateSettings(settings: SystemSettings): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/admin/settings`, 
      { settings },
      { headers: this.getHeaders() }
    );
  }

  toggleMaintenance(enabled: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/admin/settings/maintenance`, 
      { enabled },
      { headers: this.getHeaders() }
    );
  }

  toggleFeature(feature: 'roast' | 'toast', enabled: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/admin/settings/feature`, 
      { feature, enabled },
      { headers: this.getHeaders() }
    );
  }

  clearCache(): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/admin/cache/clear`, 
      {},
      { headers: this.getHeaders() }
    );
  }

  getDatabaseInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/admin/database/info`, {
      headers: this.getHeaders()
    });
  }
}
