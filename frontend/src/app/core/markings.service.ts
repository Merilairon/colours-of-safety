import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateDistrictPayload,
  CreatePoiPayload,
  District,
  Poi,
  ReviewPayload,
} from './models';

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
}
