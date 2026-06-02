import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ReviewStatus } from '../common/review-status.enum';
import { District } from './district.entity';
import { DistrictsService } from './districts.service';

describe('DistrictsService', () => {
  let service: DistrictsService;
  let repo: jest.Mocked<
    Pick<
      Repository<District>,
      | 'create'
      | 'save'
      | 'find'
      | 'findOne'
      | 'findOneOrFail'
      | 'update'
      | 'delete'
    >
  >;

  beforeEach(async () => {
    repo = {
      create: jest
        .fn()
        .mockImplementation((dto: DeepPartial<District>) => dto as District),
      save: jest
        .fn()
        .mockImplementation((district: District) => Promise.resolve(district)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findOneOrFail: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistrictsService,
        { provide: getRepositoryToken(District), useValue: repo },
      ],
    }).compile();

    service = module.get(DistrictsService);
  });

  describe('create', () => {
    it('creates a district with pending status', async () => {
      const dto = {
        name: 'Test District',
        description: 'A safe area',
        safetyRating: 4,
        area: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
      };

      const result = await service.create(dto, 'user-1');

      expect(result.status).toBe(ReviewStatus.PENDING);
      expect(result.createdById).toBe('user-1');
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });

    it('applies default values for optional fields', async () => {
      const dto = {
        name: 'Test District',
        safetyRating: 3,
        area: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
      };

      await service.create(dto, 'user-1');

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '',
          wheelchairAccessible: false,
          isAnonymous: false,
          blendEdges: false,
        }),
      );
    });

    it('respects provided optional values', async () => {
      const dto = {
        name: 'Test District',
        description: 'Custom desc',
        safetyRating: 5,
        wheelchairAccessible: true,
        area: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
        isAnonymous: true,
        blendEdges: true,
      };

      await service.create(dto, 'user-1');

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Custom desc',
          wheelchairAccessible: true,
          isAnonymous: true,
          blendEdges: true,
        }),
      );
    });
  });

  describe('findApproved', () => {
    it('returns only approved districts ordered by createdAt DESC', async () => {
      await service.findApproved();

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ReviewStatus.APPROVED },
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('findByStatus', () => {
    it('returns districts filtered by status', async () => {
      await service.findByStatus(ReviewStatus.PENDING);

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ReviewStatus.PENDING },
          order: { createdAt: 'ASC' },
        }),
      );
    });
  });

  describe('findMine', () => {
    it('returns districts created by specific user', async () => {
      await service.findMine('user-1');

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdById: 'user-1' },
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('review', () => {
    it('throws when reviewing non-existent district', async () => {
      repo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.review(
          'missing',
          { status: ReviewStatus.APPROVED },
          'reviewer-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates district with review decision', async () => {
      repo.findOne.mockResolvedValueOnce({ id: 'district-1' } as District);
      repo.findOneOrFail.mockResolvedValueOnce({
        id: 'district-1',
        status: ReviewStatus.APPROVED,
        reviewNote: 'Great area',
        reviewedById: 'reviewer-1',
      } as District);

      const result = await service.review(
        'district-1',
        { status: ReviewStatus.APPROVED, reviewNote: 'Great area' },
        'reviewer-1',
      );

      expect(repo.update).toHaveBeenCalledWith(
        'district-1',
        expect.objectContaining({
          status: ReviewStatus.APPROVED,
          reviewNote: 'Great area',
          reviewedById: 'reviewer-1',
        }),
      );
      expect(result.status).toBe(ReviewStatus.APPROVED);
    });
  });

  describe('update', () => {
    it('throws when district not found', async () => {
      repo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.update('missing', {} as never, 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when user is not owner', async () => {
      repo.findOne.mockResolvedValueOnce({
        id: 'district-1',
        createdById: 'user-2',
      } as District);

      await expect(
        service.update('district-1', {} as never, 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when district is not pending', async () => {
      repo.findOne.mockResolvedValueOnce({
        id: 'district-1',
        createdById: 'user-1',
        status: ReviewStatus.APPROVED,
      } as District);

      await expect(
        service.update('district-1', {} as never, 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates district when owner and pending', async () => {
      repo.findOne.mockResolvedValueOnce({
        id: 'district-1',
        createdById: 'user-1',
        status: ReviewStatus.PENDING,
      } as District);
      repo.findOneOrFail.mockResolvedValueOnce({
        id: 'district-1',
        name: 'Updated',
      } as District);

      const dto = {
        name: 'Updated Name',
        safetyRating: 5,
        area: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [0, 0],
              [2, 0],
              [2, 2],
              [0, 2],
              [0, 0],
            ],
          ],
        },
      };

      await service.update('district-1', dto, 'user-1');

      expect(repo.update).toHaveBeenCalledWith(
        'district-1',
        expect.objectContaining(dto),
      );
    });
  });

  describe('delete', () => {
    it('throws when district not found', async () => {
      repo.findOne.mockResolvedValueOnce(null);

      await expect(service.delete('missing', 'user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws when user is not owner', async () => {
      repo.findOne.mockResolvedValueOnce({
        id: 'district-1',
        createdById: 'user-2',
      } as District);

      await expect(
        service.delete('district-1', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when district is not pending', async () => {
      repo.findOne.mockResolvedValueOnce({
        id: 'district-1',
        createdById: 'user-1',
        status: ReviewStatus.APPROVED,
      } as District);

      await expect(
        service.delete('district-1', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes district when owner and pending', async () => {
      repo.findOne.mockResolvedValueOnce({
        id: 'district-1',
        createdById: 'user-1',
        status: ReviewStatus.PENDING,
      } as District);

      await service.delete('district-1', 'user-1');

      expect(repo.delete).toHaveBeenCalledWith('district-1');
    });
  });
});
