import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Poi } from '../pois/poi.entity';
import { User, UserRole } from '../users/user.entity';
import { PlaceRating } from './place-rating.entity';
import { RatingsService } from './ratings.service';

const author = {
  id: 'author-1',
  displayName: 'Robin',
  pronouns: null,
  avatar: null,
  email: 'robin@example.com',
  role: UserRole.USER,
} as unknown as User;

function rating(overrides: Partial<PlaceRating> = {}): PlaceRating {
  return {
    id: 'rating-1',
    poiId: 'poi-1',
    authorId: author.id,
    author,
    rating: 4,
    comment: 'Friendly staff',
    isAnonymous: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as PlaceRating;
}

describe('RatingsService', () => {
  let service: RatingsService;
  let rows: PlaceRating[];
  let ratingsRepo: Record<string, jest.Mock>;
  let poisRepo: Record<string, jest.Mock>;
  let aggregate: { count: string; avg: string | null };

  beforeEach(async () => {
    rows = [rating()];
    aggregate = { count: '1', avg: '4.0000' };
    const qb = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn(() => Promise.resolve(rows)),
      getRawOne: jest.fn(() => Promise.resolve(aggregate)),
    };
    ratingsRepo = {
      createQueryBuilder: jest.fn(() => qb),
      findOne: jest.fn(() => Promise.resolve(rows[0] ?? null)),
      findOneOrFail: jest.fn(() => Promise.resolve(rows[0])),
      create: jest.fn(() => ({})),
      merge: jest.fn((target: object, data: object) =>
        Object.assign(target, data),
      ),
      save: jest.fn((r: PlaceRating) =>
        Promise.resolve({ ...r, id: 'rating-1' }),
      ),
      delete: jest.fn(() => Promise.resolve({ affected: 1 })),
    };
    poisRepo = {
      findOne: jest.fn(() => Promise.resolve({ id: 'poi-1' } as Poi)),
      update: jest.fn(() => Promise.resolve({ affected: 1 })),
    };
    const module = await Test.createTestingModule({
      providers: [
        RatingsService,
        { provide: getRepositoryToken(PlaceRating), useValue: ratingsRepo },
        { provide: getRepositoryToken(Poi), useValue: poisRepo },
      ],
    }).compile();
    service = module.get(RatingsService);
  });

  it('only exposes the public author fields', async () => {
    const [r] = await service.list('poi-1', undefined);
    expect(r.author).toEqual({
      id: 'author-1',
      displayName: 'Robin',
      pronouns: null,
      avatar: null,
    });
    expect(JSON.stringify(r)).not.toContain('robin@example.com');
    expect(r).not.toHaveProperty('authorId');
  });

  it('hides anonymous authors from other people but not from themselves or moderators', async () => {
    rows = [rating({ isAnonymous: true })];
    const stranger = await service.list('poi-1', {
      id: 'x',
      role: UserRole.USER,
    });
    const self = await service.list('poi-1', {
      id: author.id,
      role: UserRole.USER,
    });
    const reviewer = await service.list('poi-1', {
      id: 'r',
      role: UserRole.REVIEWER,
    });

    expect(stranger[0].author).toBeNull();
    expect(self[0].author?.id).toBe(author.id);
    expect(self[0].isMine).toBe(true);
    expect(reviewer[0].author?.id).toBe(author.id);
  });

  it('404s for places that are not published', async () => {
    poisRepo.findOne.mockResolvedValue(null);
    await expect(service.list('poi-1', undefined)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates the place summary and verification date after rating', async () => {
    aggregate = { count: '3', avg: '4.3333' };
    const result = await service.upsert(
      'poi-1',
      { rating: 5, comment: '  Great  ' },
      { id: author.id, role: UserRole.USER },
    );

    expect(ratingsRepo.merge).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        rating: 5,
        comment: 'Great',
        authorId: author.id,
      }),
    );
    expect(result.summary).toEqual({ ratingCount: 3, communityRating: 4.3 });
    expect(poisRepo.update).toHaveBeenCalledWith(
      'poi-1',
      expect.objectContaining({
        ratingCount: 3,
        communityRating: 4.3,
        lastVerifiedAt: expect.any(Date) as unknown,
      }),
    );
  });

  it("lets moderators but not other users remove someone's rating", async () => {
    await expect(
      service.remove('poi-1', 'rating-1', { id: 'x', role: UserRole.USER }),
    ).rejects.toBeInstanceOf(NotFoundException);

    aggregate = { count: '0', avg: null };
    const summary = await service.remove('poi-1', 'rating-1', {
      id: 'a',
      role: UserRole.ADMIN,
    });
    expect(ratingsRepo.delete).toHaveBeenCalledWith('rating-1');
    expect(summary).toEqual({ ratingCount: 0, communityRating: null });
  });
});
