export type UserRole = 'user' | 'reviewer' | 'admin' | 'super_admin';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  emailVerified: boolean;
  banned?: boolean;
  bannedAt?: string;
  banReason?: string;
}

/** The session token is set as an HttpOnly cookie, never returned in the body. */
export interface AuthResult {
  user: AuthUser;
}

/** The only user fields the API embeds in public data (e.g. a place's author). */
export interface PublicUser {
  id: string;
  displayName: string;
  pronouns: string | null;
  avatar: string | null;
}

export interface NotificationPreferences {
  emailUpdates: boolean;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  emailVerified: boolean;
  banned: boolean;
  bannedAt?: string;
  banReason?: string;
  pronouns: string | null;
  avatar: string | null;
  bio: string | null;
  notificationPreferences: NotificationPreferences;
  pendingEmail: string | null;
  createdAt: string;
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
  /** Only present for the author and moderators. */
  reviewNote?: string | null;
  /** Null when the author chose to stay anonymous (hidden from other users). */
  createdBy?: PublicUser | null;
  createdById?: string | null;
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
  /** Only present for the author and moderators. */
  reviewNote?: string | null;
  /** Null when the author chose to stay anonymous (hidden from other users). */
  createdBy?: PublicUser | null;
  createdById?: string | null;
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
  createdBy?: PublicUser | null;
  reviewedBy?: PublicUser | null;
  createdAt: string;
}

export interface CreateEditProposalPayload {
  targetType: 'poi' | 'district';
  targetId: string;
  proposedData: EditProposalData;
}
