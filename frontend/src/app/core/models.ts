export type UserRole = 'user' | 'reviewer' | 'admin' | 'super_admin';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  emailVerified: boolean;
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
  voteCount: number;
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
  voteCount: number;
  reviewNote: string | null;
  createdBy?: AuthUser;
  createdAt: string;
  isAnonymous: boolean;
  blendEdges: boolean;
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
  blendEdges?: boolean;
}

export interface ReviewPayload {
  status: 'approved' | 'rejected';
  reviewNote?: string;
}

export interface EditProposalData {
  name?: string;
  category?: string;
  description?: string;
  safetyRating?: number;
  wheelchairAccessible?: boolean;
  location?: GeoPoint;
  area?: GeoPolygon;
  blendEdges?: boolean;
}

export interface EditProposal {
  id: string;
  targetType: 'poi' | 'district';
  targetId: string;
  originalData: EditProposalData;
  proposedData: EditProposalData;
  status: ReviewStatus;
  reviewNote: string | null;
  createdBy?: AuthUser;
  reviewedBy?: AuthUser;
  createdAt: string;
}

export interface CreateEditProposalPayload {
  targetType: 'poi' | 'district';
  targetId: string;
  proposedData: EditProposalData;
}
