import type { AuthUser } from '../auth/jwt-payload.interface';
import type { District } from '../districts/district.entity';
import type { EditProposal } from '../edits/edit-proposal.entity';
import type { Poi } from '../pois/poi.entity';
import { Pronouns, User, UserRole } from '../users/user.entity';

/**
 * The only user fields that may appear inside another resource (a POI's
 * `createdBy`, an edit's `reviewedBy`, …). Anything not listed here — email,
 * role, tokens, ban state, pending email — must never leave the API embedded
 * in public data.
 */
export interface PublicUser {
  id: string;
  displayName: string;
  pronouns: Pronouns | null;
  avatar: string | null;
}

/** Who is asking; `undefined` for guests. */
export type Viewer = Pick<AuthUser, 'id' | 'role'> | undefined;

const MODERATOR_ROLES: UserRole[] = [
  UserRole.REVIEWER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

export function isModerator(viewer: Viewer): boolean {
  return !!viewer && MODERATOR_ROLES.includes(viewer.role);
}

export function toPublicUser(user: User | null | undefined): PublicUser | null {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    displayName: user.displayName,
    pronouns: user.pronouns ?? null,
    avatar: user.avatar ?? null,
  };
}

type Submission = Poi | District;

export type PublicSubmission<T extends Submission> = Omit<
  T,
  'createdBy' | 'createdById' | 'reviewedBy' | 'reviewedById' | 'reviewNote'
> & {
  createdBy: PublicUser | null;
  createdById: string | null;
  reviewNote?: string | null;
};

/**
 * Serialises a POI or district for API output.
 *
 * - `createdBy` is reduced to {@link PublicUser}.
 * - `reviewedBy`/`reviewedById` are never exposed.
 * - `isAnonymous` hides the author from everyone except the author and
 *   moderators. On an LGBTQIA+ safety map, leaking this can out people.
 * - `reviewNote` is private feedback between moderators and the author.
 */
export function serializeSubmission<T extends Submission>(
  item: T,
  viewer: Viewer,
): PublicSubmission<T> {
  const { createdBy, createdById, reviewNote } = item;
  const rest: Partial<T> = { ...item };
  delete rest.createdBy;
  delete rest.createdById;
  delete rest.reviewedBy;
  delete rest.reviewedById;
  delete rest.reviewNote;

  const isOwner = !!viewer && viewer.id === createdById;
  const privileged = isOwner || isModerator(viewer);
  const hideAuthor = item.isAnonymous && !privileged;

  const result = {
    ...rest,
    createdBy: hideAuthor ? null : toPublicUser(createdBy),
    createdById: hideAuthor ? null : createdById,
  } as PublicSubmission<T>;
  if (privileged) {
    result.reviewNote = reviewNote;
  }
  return result;
}

export function serializeSubmissions<T extends Submission>(
  items: T[],
  viewer: Viewer,
): PublicSubmission<T>[] {
  return items.map((item) => serializeSubmission(item, viewer));
}

export type PublicEditProposal = Omit<
  EditProposal,
  'createdBy' | 'reviewedBy'
> & {
  createdBy: PublicUser | null;
  reviewedBy: PublicUser | null;
};

/** Edit proposals are only visible to their author and moderators. */
export function serializeEditProposal(
  proposal: EditProposal,
): PublicEditProposal {
  return {
    ...proposal,
    createdBy: toPublicUser(proposal.createdBy),
    reviewedBy: toPublicUser(proposal.reviewedBy),
  };
}
