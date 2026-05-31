import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewStatus } from '../common/review-status.enum';
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
        where: { status: ReviewStatus.APPROVED },
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
});
