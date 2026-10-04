import type { Poi } from '../pois/poi.entity';
import { Pronouns, User, UserRole } from '../users/user.entity';
import { ReviewStatus } from './review-status.enum';
import {
  serializeEditProposal,
  serializeSubmission,
  Viewer,
} from './public-serializer';
import type { EditProposal } from '../edits/edit-proposal.entity';

const PUBLIC_USER_KEYS = ['avatar', 'displayName', 'id', 'pronouns'];

/** A user row with every sensitive column populated. */
const author = {
  id: 'author-1',
  email: 'author@example.com',
  displayName: 'Author',
  passwordHash: 'hash',
  role: UserRole.USER,
  pronouns: Pronouns.THEY_THEM,
  emailVerified: false,
  emailVerificationToken: 'verify-secret',
  emailVerificationExpires: new Date(),
  banned: false,
  bannedAt: null,
  banReason: null,
  avatar: 'https://example.com/a.png',
  bio: 'bio',
  notificationPreferences: { emailUpdates: true },
  pendingEmail: 'new@example.com',
  emailChangeToken: 'change-secret',
  emailChangeExpires: new Date(),
  passwordResetToken: 'reset-secret',
  passwordResetExpires: new Date(),
  passwordChangedAt: null,
  createdAt: new Date(),
} satisfies User;

const reviewer = { ...author, id: 'reviewer-1', role: UserRole.REVIEWER };

function poi(overrides: Partial<Poi> = {}): Poi {
  return {
    id: 'poi-1',
    name: 'Rainbow Cafe',
    description: '',
    category: 'cafe',
    safetyRating: 5,
    wheelchairAccessible: false,
    isAnonymous: false,
    location: { type: 'Point', coordinates: [4.35, 50.85] },
    status: ReviewStatus.APPROVED,
    banned: false,
    voteCount: 0,
    reviewNote: 'private moderator feedback',
    createdBy: author,
    createdById: author.id,
    reviewedBy: reviewer,
    reviewedById: reviewer.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const guest: Viewer = undefined;
const stranger: Viewer = { id: 'someone-else', role: UserRole.USER };
const owner: Viewer = { id: author.id, role: UserRole.USER };
const moderators: Viewer[] = [
  { id: 'r', role: UserRole.REVIEWER },
  { id: 'a', role: UserRole.ADMIN },
  { id: 's', role: UserRole.SUPER_ADMIN },
];

describe('serializeSubmission', () => {
  it('reduces createdBy to the public user allow-list', () => {
    const result = serializeSubmission(poi(), guest);

    expect(Object.keys(result.createdBy!).sort()).toEqual(PUBLIC_USER_KEYS);
    expect(result.createdBy).toEqual({
      id: author.id,
      displayName: 'Author',
      pronouns: Pronouns.THEY_THEM,
      avatar: 'https://example.com/a.png',
    });
  });

  it.each([guest, stranger, owner, ...moderators])(
    'never exposes reviewedBy or reviewedById (viewer %j)',
    (viewer) => {
      const result = serializeSubmission(poi(), viewer);

      expect(result).not.toHaveProperty('reviewedBy');
      expect(result).not.toHaveProperty('reviewedById');
    },
  );

  it('never leaks a secret anywhere in the payload', () => {
    const json = JSON.stringify(serializeSubmission(poi(), moderators[2]));

    for (const secret of [
      'author@example.com',
      'verify-secret',
      'change-secret',
      'reset-secret',
      'new@example.com',
      '"hash"',
    ]) {
      expect(json).not.toContain(secret);
    }
  });

  describe('anonymous submissions', () => {
    const anonymous = poi({ isAnonymous: true });

    it.each([
      ['guest', guest],
      ['another user', stranger],
    ])('hides the author from %s', (_label, viewer) => {
      const result = serializeSubmission(anonymous, viewer);

      expect(result.createdBy).toBeNull();
      expect(result.createdById).toBeNull();
      expect(JSON.stringify(result)).not.toContain(author.id);
      expect(JSON.stringify(result)).not.toContain('Author');
    });

    it.each([owner, ...moderators])('shows the author to %j', (viewer) => {
      const result = serializeSubmission(anonymous, viewer);

      expect(result.createdBy?.id).toBe(author.id);
      expect(result.createdById).toBe(author.id);
    });
  });

  it('shows the author of non-anonymous submissions to everyone', () => {
    expect(serializeSubmission(poi(), guest).createdById).toBe(author.id);
  });

  it('only shows the review note to the owner and moderators', () => {
    expect(serializeSubmission(poi(), guest)).not.toHaveProperty('reviewNote');
    expect(serializeSubmission(poi(), stranger)).not.toHaveProperty(
      'reviewNote',
    );
    expect(serializeSubmission(poi(), owner).reviewNote).toBe(
      'private moderator feedback',
    );
    expect(serializeSubmission(poi(), moderators[0]).reviewNote).toBe(
      'private moderator feedback',
    );
  });
});

describe('serializeEditProposal', () => {
  it('reduces createdBy and reviewedBy to the public user allow-list', () => {
    const result = serializeEditProposal({
      id: 'edit-1',
      createdBy: author,
      reviewedBy: reviewer,
    } as EditProposal);

    expect(Object.keys(result.createdBy!).sort()).toEqual(PUBLIC_USER_KEYS);
    expect(Object.keys(result.reviewedBy!).sort()).toEqual(PUBLIC_USER_KEYS);
  });

  it('handles a missing reviewer', () => {
    const result = serializeEditProposal({
      id: 'edit-1',
      createdBy: author,
      reviewedBy: null,
    } as EditProposal);

    expect(result.reviewedBy).toBeNull();
  });
});
