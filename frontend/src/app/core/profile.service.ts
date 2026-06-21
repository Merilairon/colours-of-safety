import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Profile, NotificationPreferences } from './models';

export interface UpdateProfilePayload {
  displayName?: string;
  avatar?: string | null;
  bio?: string | null;
  notificationPreferences?: NotificationPreferences;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface RequestEmailChangePayload {
  newEmail: string;
  password: string;
}

export interface ConfirmEmailChangePayload {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private readonly http: HttpClient) {}

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>('/api/users/me');
  }

  updateProfile(payload: UpdateProfilePayload): Observable<Profile> {
    return this.http.patch<Profile>('/api/users/me', payload);
  }

  changePassword(payload: ChangePasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/change-password', payload);
  }

  requestEmailChange(payload: RequestEmailChangePayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/request-email-change', payload);
  }

  confirmEmailChange(payload: ConfirmEmailChangePayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/confirm-email-change', payload);
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>('/api/users/me');
  }
}
