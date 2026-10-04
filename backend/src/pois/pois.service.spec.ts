import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewStatus } from '../common/review-status.enum';
import { UserRole } from '../users/user.entity';
import { Poi } from './poi.entity';
import { PoisService } from './pois.service';

describe('PoisService', () => {
  let service: PoisService;
  let repo: jest.Mocked<
    Pick<
      Repository<Poi>,
      'create' | 'save' | 'find' | 'findOne' | 'findOneOrFail' | 'update'
    >
  >;

  beforeEach(async () => {
    repo = {
      create: jest.fn((dto: Partial<Poi>) => dto as Poi),
      save: jest.fn((poi: Poi) => Promise.resolve(poi)),
      find: jest.fn(() => Promise.resolve([])),
      findOne: jest.fn(() => Promise.resolve(null)),
      findOneOrFail: jest.fn(() => Promise.resolve({} as Poi)),
      update: jest.fn(() => Promise.resolve({ affected: 1 } as never)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoisService,
        { provide: getRepositoryToken(Poi), useValue: repo },
      ],
    }).compile();

    service = module.get(PoisService);
  });

  it('creates a POI with pending status owned by the author', async () => {
    const poi = await service.create(
      {
        name: 'Safe Cafe',
        safetyRating: 5,
        location: { type: 'Point', coordinates: [4.35, 50.85] },
      },
      'user-1',
    );

    expect(poi.status).toBe(ReviewStatus.PENDING);
    expect(poi.createdById).toBe('user-1');
    expect(poi.location).toEqual({ type: 'Point', coordinates: [4.35, 50.85] });
    expect(repo.save).toHaveBeenCalled();
  });

  it('only returns approved POIs for the public feed', async () => {
    await service.findApproved();
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: ReviewStatus.APPROVED, banned: false },
      }),
    );
  });

  it('throws when reviewing a missing POI', async () => {
    await expect(
      service.review(
        'missing',
        { status: ReviewStatus.APPROVED },
        'reviewer-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('records the reviewer decision', async () => {
    repo.findOne.mockResolvedValueOnce({
      id: 'poi-1',
      status: ReviewStatus.PENDING,
    } as Poi);
    repo.findOneOrFail.mockResolvedValueOnce({
      id: 'poi-1',
      status: ReviewStatus.APPROVED,
      reviewNote: 'looks good',
      reviewedById: 'reviewer-1',
    } as Poi);

    const result = await service.review(
      'poi-1',
      { status: ReviewStatus.APPROVED, reviewNote: 'looks good' },
      'reviewer-1',
    );

    expect(repo.update).toHaveBeenCalledWith(
      'poi-1',
      expect.objectContaining({
        status: ReviewStatus.APPROVED,
        reviewNote: 'looks good',
        reviewedById: 'reviewer-1',
      }),
    );
    expect(result.status).toBe(ReviewStatus.APPROVED);
    expect(result.reviewedById).toBe('reviewer-1');
  });
  describe('findVisibleById', () => {
    const stored = (status: ReviewStatus, banned = false) =>
      ({ id: 'poi-1', status, banned, createdById: 'owner-1' }) as Poi;
    const owner = { id: 'owner-1', role: UserRole.USER };
    const stranger = { id: 'someone', role: UserRole.USER };
    const reviewer = { id: 'rev-1', role: UserRole.REVIEWER };

    it('returns approved POIs to guests', async () => {
      repo.findOne.mockResolvedValueOnce(stored(ReviewStatus.APPROVED));
      await expect(
        service.findVisibleById('poi-1', undefined),
      ).resolves.toBeTruthy();
    });

    it('returns 404 for a missing POI', async () => {
      await expect(
        service.findVisibleById('poi-1', undefined),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it.each([
      [ReviewStatus.PENDING, false],
      [ReviewStatus.REJECTED, false],
      [ReviewStatus.APPROVED, true],
    ])(
      'hides %s (banned=%s) POIs from guests and other users',
      async (status, banned) => {
        for (const viewer of [undefined, stranger]) {
          repo.findOne.mockResolvedValueOnce(stored(status, banned));
          await expect(
            service.findVisibleById('poi-1', viewer),
          ).rejects.toBeInstanceOf(NotFoundException);
        }
      },
    );

    it.each([ReviewStatus.PENDING, ReviewStatus.REJECTED])(
      'shows %s POIs to the owner and reviewers',
      async (status) => {
        for (const viewer of [owner, reviewer]) {
          repo.findOne.mockResolvedValueOnce(stored(status));
          await expect(
            service.findVisibleById('poi-1', viewer),
          ).resolves.toBeTruthy();
        }
      },
    );
  });

  it('stores optional contact details, blank as null', async () => {
    const poi = await service.create(
      {
        name: 'Safe Cafe',
        safetyRating: 5,
        location: { type: 'Point', coordinates: [4.35, 50.85] },
        address: ' Rue Haute 1, 1000 Brussels ',
        website: '',
        openingHours: 'Mo-Fr 10:00-18:00',
      },
      'user-1',
    );

    expect(poi.address).toBe('Rue Haute 1, 1000 Brussels');
    expect(poi.website).toBeNull();
    expect(poi.openingHours).toBe('Mo-Fr 10:00-18:00');
  });

  it('marks a place as verified when a reviewer approves it, not when rejected', async () => {
    repo.findOne.mockResolvedValue({ id: 'poi-1' } as Poi);

    await service.review('poi-1', { status: ReviewStatus.APPROVED }, 'rev-1');
    expect(repo.update).toHaveBeenLastCalledWith(
      'poi-1',
      expect.objectContaining({ lastVerifiedAt: expect.any(Date) as unknown }),
    );

    await service.review('poi-1', { status: ReviewStatus.REJECTED }, 'rev-1');
    expect(repo.update).toHaveBeenLastCalledWith(
      'poi-1',
      expect.not.objectContaining({
        lastVerifiedAt: expect.anything() as unknown,
      }),
    );
  });
});
