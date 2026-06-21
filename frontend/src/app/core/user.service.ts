import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthUser, UserRole } from './models';

export interface UpdateRolePayload {
  role: UserRole;
}

export interface BanPayload {
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpClient) {}

  getUsers(): Observable<AuthUser[]> {
    return this.http.get<AuthUser[]>('/api/users');
  }

  updateUserRole(id: string, role: UserRole): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`/api/users/${id}/role`, { role });
  }

  banUser(id: string, reason?: string): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`/api/users/${id}/ban`, { reason });
  }

  unbanUser(id: string): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`/api/users/${id}/unban`, {});
  }
}
