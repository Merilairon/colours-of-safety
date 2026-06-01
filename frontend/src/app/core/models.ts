export type UserRole = 'user' | 'reviewer' | 'admin' | 'super_admin';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface Poi {
  id: string;
  name: string;
  description: string;
  category: string;
  safetyRating: number;
  wheelchairAccessible: boolean;
  location: GeoPoint;
  status: ReviewStatus;
  reviewNote: string | null;
  createdBy?: AuthUser;
  createdAt: string;
  isAnonymous: boolean;
}

export interface District {
  id: string;
  name: string;
  description: string;
  safetyRating: number;
  wheelchairAccessible: boolean;
  area: GeoPolygon;
  status: ReviewStatus;
  reviewNote: string | null;
  createdBy?: AuthUser;
  createdAt: string;
  isAnonymous: boolean;
}

export interface CreatePoiPayload {
  name: string;
  description?: string;
  category?: string;
  safetyRating: number;
  wheelchairAccessible?: boolean;
  location: GeoPoint;
  isAnonymous?: boolean;
}

export interface CreateDistrictPayload {
  name: string;
  description?: string;
  safetyRating: number;
  wheelchairAccessible?: boolean;
  area: GeoPolygon;
  isAnonymous?: boolean;
}

export interface ReviewPayload {
  status: 'approved' | 'rejected';
  reviewNote?: string;
}
