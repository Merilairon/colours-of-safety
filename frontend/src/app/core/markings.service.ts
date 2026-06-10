import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateDistrictPayload, CreatePoiPayload, District, Poi, ReviewPayload } from './models';

export interface VoteResponse {
  success: boolean;
  voteCount: number;
  autoApproved: boolean;
}

export interface VoteStatusResponse {
  voted: boolean;
}

@Injectable({ providedIn: 'root' })
export class MarkingsService {
  constructor(private readonly http: HttpClient) {}

  // ----- POIs -----
  getApprovedPois(): Observable<Poi[]> {
    return this.http.get<Poi[]>('/api/pois');
  }

  getPendingPois(): Observable<Poi[]> {
    return this.http.get<Poi[]>('/api/pois/pending');
  }

  getMyPois(): Observable<Poi[]> {
    return this.http.get<Poi[]>('/api/pois/mine');
  }

  createPoi(payload: CreatePoiPayload): Observable<Poi> {
    return this.http.post<Poi>('/api/pois', payload);
  }

  reviewPoi(id: string, payload: ReviewPayload): Observable<Poi> {
    return this.http.patch<Poi>(`/api/pois/${id}/review`, payload);
  }

  updatePoi(id: string, payload: CreatePoiPayload): Observable<Poi> {
    return this.http.put<Poi>(`/api/pois/${id}`, payload);
  }

  deletePoi(id: string): Observable<void> {
    return this.http.delete<void>(`/api/pois/${id}`);
  }

  getPoiById(id: string): Observable<Poi | null> {
    return this.http.get<Poi>(`/api/pois/${id}`);
  }

  // ----- Districts -----
  getApprovedDistricts(): Observable<District[]> {
    return this.http.get<District[]>('/api/districts');
  }

  getPendingDistricts(): Observable<District[]> {
    return this.http.get<District[]>('/api/districts/pending');
  }

  getMyDistricts(): Observable<District[]> {
    return this.http.get<District[]>('/api/districts/mine');
  }

  createDistrict(payload: CreateDistrictPayload): Observable<District> {
    return this.http.post<District>('/api/districts', payload);
  }

  reviewDistrict(id: string, payload: ReviewPayload): Observable<District> {
    return this.http.patch<District>(`/api/districts/${id}/review`, payload);
  }

  updateDistrict(id: string, payload: CreateDistrictPayload): Observable<District> {
    return this.http.put<District>(`/api/districts/${id}`, payload);
  }

  deleteDistrict(id: string): Observable<void> {
    return this.http.delete<void>(`/api/districts/${id}`);
  }

  getDistrictById(id: string): Observable<District | null> {
    return this.http.get<District>(`/api/districts/${id}`);
  }

  // ----- Voting -----
  votePoi(id: string): Observable<VoteResponse> {
    return this.http.post<VoteResponse>(`/api/pois/${id}/vote`, {});
  }

  voteDistrict(id: string): Observable<VoteResponse> {
    return this.http.post<VoteResponse>(`/api/districts/${id}/vote`, {});
  }

  hasVotedPoi(id: string): Observable<VoteStatusResponse> {
    return this.http.get<VoteStatusResponse>(`/api/pois/${id}/voted`);
  }

  hasVotedDistrict(id: string): Observable<VoteStatusResponse> {
    return this.http.get<VoteStatusResponse>(`/api/districts/${id}/voted`);
  }
}
