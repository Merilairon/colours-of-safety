import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthUser, UserRole } from './models';

export interface UpdateRolePayload {
  role: UserRole;
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
}
