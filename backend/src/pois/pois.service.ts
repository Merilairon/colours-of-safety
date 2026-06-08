import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewDto } from '../common/review.dto';
import { ReviewStatus } from '../common/review-status.enum';
import { UserRole } from '../users/user.entity';
import { CreatePoiDto } from './dto/create-poi.dto';
import { Poi } from './poi.entity';

@Injectable()
export class PoisService {
  constructor(
    @InjectRepository(Poi)
    private readonly pois: Repository<Poi>,
  ) {}

  create(dto: CreatePoiDto, userId: string): Promise<Poi> {
    const poi = this.pois.create({
      name: dto.name,
      description: dto.description ?? '',
      category: dto.category ?? 'other',
      safetyRating: dto.safetyRating,
      wheelchairAccessible: dto.wheelchairAccessible ?? false,
      location: { type: 'Point', coordinates: dto.location.coordinates },
      status: ReviewStatus.PENDING,
      createdById: userId,
      isAnonymous: dto.isAnonymous ?? false,
    });
    return this.pois.save(poi);
  }

  findApproved(): Promise<Poi[]> {
    return this.pois.find({
      where: { status: ReviewStatus.APPROVED },
      order: { createdAt: 'DESC' },
    });
  }

  findByStatus(status: ReviewStatus): Promise<Poi[]> {
    return this.pois.find({
      where: { status },
      order: { createdAt: 'ASC' },
    });
  }

  findMine(userId: string): Promise<Poi[]> {
    return this.pois.find({
      where: { createdById: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async review(id: string, dto: ReviewDto, reviewerId: string): Promise<Poi> {
    const poi = await this.pois.findOne({ where: { id } });
    if (!poi) {
      throw new NotFoundException('POI not found');
    }
    await this.pois.update(id, {
      status: dto.status,
      reviewNote: dto.reviewNote ?? null,
      reviewedById: reviewerId,
    });
    return this.pois.findOneOrFail({ where: { id } });
  }

  async update(id: string, dto: CreatePoiDto, userId: string): Promise<Poi> {
    const poi = await this.pois.findOne({ where: { id } });
    if (!poi) {
      throw new NotFoundException('POI not found');
    }
    if (poi.createdById !== userId) {
      throw new NotFoundException('POI not found');
    }
    if (poi.status !== ReviewStatus.PENDING) {
      throw new NotFoundException('Only pending submissions can be edited');
    }
    await this.pois.update(id, {
      name: dto.name,
      description: dto.description ?? '',
      category: dto.category ?? 'other',
      safetyRating: dto.safetyRating,
      wheelchairAccessible: dto.wheelchairAccessible ?? false,
      location: { type: 'Point', coordinates: dto.location.coordinates },
      isAnonymous: dto.isAnonymous ?? false,
    });
    return this.pois.findOneOrFail({ where: { id } });
  }

  private static readonly ELEVATED_ROLES: UserRole[] = [
    UserRole.REVIEWER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ];

  async delete(id: string, userId: string, userRole: UserRole): Promise<void> {
    const poi = await this.pois.findOne({ where: { id } });
    if (!poi) {
      throw new NotFoundException('POI not found');
    }

    const isOwner = poi.createdById === userId;
    const isElevated = PoisService.ELEVATED_ROLES.includes(userRole);

    if (isOwner && poi.status === ReviewStatus.PENDING) {
      await this.pois.delete(id);
      return;
    }

    if (isElevated) {
      await this.pois.update(id, {
        status: ReviewStatus.REJECTED,
        reviewNote: 'Removed by moderator',
        reviewedById: userId,
      });
      return;
    }

    throw new ForbiddenException(
      'Only pending submissions can be deleted by their owner',
    );
  }
}
