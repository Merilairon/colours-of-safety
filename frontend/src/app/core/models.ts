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

/** Where an entry came from; anything but `community` is a bulk import. */
export type PlaceSource = 'community' | 'openstreetmap' | 'wikidata' | 'curated' | 'imported';

/** Provenance shared by places and districts (LSA-B12, LSA-F13). */
export interface Provenance {
  source: PlaceSource;
  sourceUrl: string | null;
  /** When a person last confirmed the entry; null for unconfirmed imports. */
  lastVerifiedAt: string | null;
}

export interface Poi extends Provenance {
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
  address: string | null;
  website: string | null;
  openingHours: string | null;
  /** Community ratings (LSA-F5). */
  ratingCount: number;
  communityRating: number | null;
}

export interface District extends Provenance {
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
  address?: string;
  website?: string;
  openingHours?: string;
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
  address?: string | null;
  website?: string | null;
  openingHours?: string | null;
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

/** A community member's rating and short review of a place (LSA-F5). */
export interface PlaceRating {
  id: string;
  rating: number;
  comment: string;
  /** Null when the author chose to stay anonymous. */
  author: PublicUser | null;
  isAnonymous: boolean;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  ratingCount: number;
  communityRating: number | null;
}

export interface UpsertRatingPayload {
  rating: number;
  comment?: string;
  isAnonymous?: boolean;
}

export type ReportTargetType = 'poi' | 'district' | 'rating';

export type ReportReason =
  | 'closed'
  | 'wrong_location'
  | 'wrong_details'
  | 'not_safe'
  | 'not_lgbtq_related'
  | 'duplicate'
  | 'offensive'
  | 'spam'
  | 'other';

export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export interface CreateReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

/** A report as moderators see it in the review queue (LSA-F4). */
export interface ModeratorReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetName: string | null;
  placeId: string | null;
  excerpt: string | null;
  reason: ReportReason;
  details: string;
  reporter: PublicUser | null;
  status: ReportStatus;
  resolvedBy: PublicUser | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}
