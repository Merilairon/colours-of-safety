import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { District } from '../districts/district.entity';
import { Poi } from '../pois/poi.entity';
import { PlaceRating } from '../ratings/place-rating.entity';
import { User } from '../users/user.entity';
import { Report, ReportStatus } from './report.entity';
import { ReportsService } from './reports.service';

const reporter = {
  id: 'u1',
  displayName: 'Sam',
  pronouns: null,
  avatar: null,
  email: 'sam@example.com',
} as unknown as User;

describe('ReportsService', () => {
  let service: ReportsService;
  let reports: Record<string, jest.Mock>;
  let pois: Record<string, jest.Mock>;

  beforeEach(async () => {
    const stored = {
      id: 'rep-1',
      targetType: 'poi',
      targetId: 'poi-1',
      reason: 'closed',
      details: 'Shut down last year',
      reporter,
      reporterId: reporter.id,
      status: ReportStatus.OPEN,
      resolvedBy: null,
      resolvedById: null,
      resolutionNote: null,
      resolvedAt: null,
      createdAt: new Date(),
    } as Report;
    reports = {
      create: jest.fn((r: Partial<Report>) => r),
      save: jest.fn((r: Partial<Report>) =>
        Promise.resolve({ ...r, id: 'rep-1' }),
      ),
      find: jest.fn(() => Promise.resolve([stored])),
      findOne: jest.fn(() => Promise.resolve(stored)),
      findOneOrFail: jest.fn(() =>
        Promise.resolve({ ...stored, status: ReportStatus.RESOLVED }),
      ),
      update: jest.fn(() => Promise.resolve({ affected: 1 })),
    };
    pois = {
      exists: jest.fn(() => Promise.resolve(true)),
      find: jest.fn(() =>
        Promise.resolve([{ id: 'poi-1', name: 'Rainbow Cafe' }]),
      ),
    };
    const empty = {
      exists: jest.fn(() => Promise.resolve(false)),
      find: jest.fn(() => Promise.resolve([])),
    };
    const module = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Report), useValue: reports },
        { provide: getRepositoryToken(Poi), useValue: pois },
        { provide: getRepositoryToken(District), useValue: empty },
        { provide: getRepositoryToken(PlaceRating), useValue: empty },
      ],
    }).compile();
    service = module.get(ReportsService);
  });

  it('accepts reports from guests and returns only the id', async () => {
    const result = await service.create(
      {
        targetType: 'poi',
        targetId: 'poi-1',
        reason: 'closed',
        details: ' gone ',
      },
      null,
    );
    expect(result).toEqual({ id: 'rep-1' });
    expect(reports.create).toHaveBeenCalledWith(
      expect.objectContaining({ reporterId: null, details: 'gone' }),
    );
  });

  it('refuses reports about things that are not published', async () => {
    pois.exists.mockResolvedValue(false);
    await expect(
      service.create(
        { targetType: 'poi', targetId: 'poi-1', reason: 'closed' },
        'u1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('shows moderators the target name and a public reporter, never the email', async () => {
    const [report] = await service.findByStatus(ReportStatus.OPEN);
    expect(report.targetName).toBe('Rainbow Cafe');
    expect(report.placeId).toBe('poi-1');
    expect(report.reporter).toEqual({
      id: 'u1',
      displayName: 'Sam',
      pronouns: null,
      avatar: null,
    });
    expect(JSON.stringify(report)).not.toContain('sam@example.com');
  });

  it('records who resolved a report, once', async () => {
    const updated = await service.resolve(
      'rep-1',
      { status: ReportStatus.RESOLVED, note: 'Marked closed' },
      'mod-1',
    );
    expect(reports.update).toHaveBeenCalledWith(
      'rep-1',
      expect.objectContaining({
        status: ReportStatus.RESOLVED,
        resolutionNote: 'Marked closed',
        resolvedById: 'mod-1',
      }),
    );
    expect(updated.status).toBe(ReportStatus.RESOLVED);

    reports.findOne.mockResolvedValue({ status: ReportStatus.RESOLVED });
    await expect(
      service.resolve('rep-1', { status: ReportStatus.DISMISSED }, 'mod-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
