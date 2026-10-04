import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PublicUser, toPublicUser } from '../common/public-serializer';
import { ReviewStatus } from '../common/review-status.enum';
import { District } from '../districts/district.entity';
import { Poi } from '../pois/poi.entity';
import { PlaceRating } from '../ratings/place-rating.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { Report, ReportStatus, ReportTargetType } from './report.entity';

/** What moderators see in the queue; never the reporter's email. */
export interface ModeratorReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  /** Place/district name, or the rated place's name for a rating. */
  targetName: string | null;
  /** Place page to open: the target itself, or the rated place for a rating. */
  placeId: string | null;
  /** For ratings: the reported text. */
  excerpt: string | null;
  reason: Report['reason'];
  details: string;
  reporter: PublicUser | null;
  status: ReportStatus;
  resolvedBy: PublicUser | null;
  resolutionNote: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reports: Repository<Report>,
    @InjectRepository(Poi)
    private readonly pois: Repository<Poi>,
    @InjectRepository(District)
    private readonly districts: Repository<District>,
    @InjectRepository(PlaceRating)
    private readonly ratings: Repository<PlaceRating>,
  ) {}

  /** Anyone may report something that is publicly visible. */
  async create(
    dto: CreateReportDto,
    reporterId: string | null,
  ): Promise<{ id: string }> {
    if (!(await this.isPubliclyVisible(dto.targetType, dto.targetId))) {
      throw new NotFoundException('Nothing to report here');
    }
    const report = await this.reports.save(
      this.reports.create({
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details?.trim() ?? '',
        reporterId,
      }),
    );
    // Only the id goes back, so reporters never see moderator fields.
    return { id: report.id };
  }

  async findByStatus(status: ReportStatus): Promise<ModeratorReport[]> {
    const rows = await this.reports.find({
      where: { status },
      order: { createdAt: status === ReportStatus.OPEN ? 'ASC' : 'DESC' },
      take: 200,
    });
    return this.withTargets(rows);
  }

  async resolve(
    id: string,
    dto: ResolveReportDto,
    moderatorId: string,
  ): Promise<ModeratorReport> {
    const report = await this.reports.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (report.status !== ReportStatus.OPEN) {
      throw new BadRequestException('Report has already been handled');
    }
    await this.reports.update(id, {
      status: dto.status,
      resolutionNote: dto.note?.trim() || null,
      resolvedById: moderatorId,
      resolvedAt: new Date(),
    });
    const [updated] = await this.withTargets([
      await this.reports.findOneOrFail({ where: { id } }),
    ]);
    return updated;
  }

  private async isPubliclyVisible(
    type: ReportTargetType,
    id: string,
  ): Promise<boolean> {
    const published = { id, status: ReviewStatus.APPROVED, banned: false };
    switch (type) {
      case 'poi':
        return this.pois.exists({ where: published });
      case 'district':
        return this.districts.exists({ where: published });
      case 'rating':
        return this.ratings.exists({
          where: {
            id,
            poi: { status: ReviewStatus.APPROVED, banned: false },
          },
        });
    }
  }

  /** Attaches a readable name to each report with one query per target type. */
  private async withTargets(rows: Report[]): Promise<ModeratorReport[]> {
    const ids = (type: ReportTargetType) =>
      rows.filter((r) => r.targetType === type).map((r) => r.targetId);
    const [pois, districts, ratings] = await Promise.all([
      this.pois.find({ where: { id: In(ids('poi')) }, select: ['id', 'name'] }),
      this.districts.find({
        where: { id: In(ids('district')) },
        select: ['id', 'name'],
      }),
      this.ratings.find({
        where: { id: In(ids('rating')) },
        relations: { poi: true },
      }),
    ]);
    const names = new Map<string, string>();
    pois.forEach((p) => names.set(p.id, p.name));
    districts.forEach((d) => names.set(d.id, d.name));
    const ratingById = new Map(ratings.map((r) => [r.id, r]));

    return rows.map((r) => {
      const rating =
        r.targetType === 'rating' ? ratingById.get(r.targetId) : undefined;
      return {
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        targetName: rating ? rating.poi.name : (names.get(r.targetId) ?? null),
        placeId: rating ? rating.poiId : r.targetId,
        excerpt: rating ? rating.comment || `Rated ${rating.rating}/5` : null,
        reason: r.reason,
        details: r.details,
        reporter: toPublicUser(r.reporter),
        status: r.status,
        resolvedBy: toPublicUser(r.resolvedBy),
        resolutionNote: r.resolutionNote,
        resolvedAt: r.resolvedAt,
        createdAt: r.createdAt,
      };
    });
  }
}
