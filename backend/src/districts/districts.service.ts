import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewDto } from '../common/review.dto';
import { ReviewStatus } from '../common/review-status.enum';
import { District } from './district.entity';
import { CreateDistrictDto } from './dto/create-district.dto';

@Injectable()
export class DistrictsService {
  constructor(
    @InjectRepository(District)
    private readonly districts: Repository<District>,
  ) {}

  create(dto: CreateDistrictDto, userId: string): Promise<District> {
    const district = this.districts.create({
      name: dto.name,
      description: dto.description ?? '',
      safetyRating: dto.safetyRating,
      wheelchairAccessible: dto.wheelchairAccessible ?? false,
      area: { type: 'Polygon', coordinates: dto.area.coordinates },
      status: ReviewStatus.PENDING,
      createdById: userId,
      isAnonymous: dto.isAnonymous ?? false,
    });
    return this.districts.save(district);
  }

  findApproved(): Promise<District[]> {
    return this.districts.find({
      where: { status: ReviewStatus.APPROVED },
      order: { createdAt: 'DESC' },
    });
  }

  findByStatus(status: ReviewStatus): Promise<District[]> {
    return this.districts.find({
      where: { status },
      order: { createdAt: 'ASC' },
    });
  }

  findMine(userId: string): Promise<District[]> {
    return this.districts.find({
      where: { createdById: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async review(
    id: string,
    dto: ReviewDto,
    reviewerId: string,
  ): Promise<District> {
    const district = await this.districts.findOne({ where: { id } });
    if (!district) {
      throw new NotFoundException('District not found');
    }
    await this.districts.update(id, {
      status: dto.status,
      reviewNote: dto.reviewNote ?? null,
      reviewedById: reviewerId,
    });
    return this.districts.findOneOrFail({ where: { id } });
  }

  async update(
    id: string,
    dto: CreateDistrictDto,
    userId: string,
  ): Promise<District> {
    const district = await this.districts.findOne({ where: { id } });
    if (!district) {
      throw new NotFoundException('District not found');
    }
    if (district.createdById !== userId) {
      throw new NotFoundException('District not found');
    }
    if (district.status !== ReviewStatus.PENDING) {
      throw new NotFoundException('Only pending submissions can be edited');
    }
    await this.districts.update(id, {
      name: dto.name,
      description: dto.description ?? '',
      safetyRating: dto.safetyRating,
      wheelchairAccessible: dto.wheelchairAccessible ?? false,
      area: { type: 'Polygon', coordinates: dto.area.coordinates },
      isAnonymous: dto.isAnonymous ?? false,
    });
    return this.districts.findOneOrFail({ where: { id } });
  }

  async delete(id: string, userId: string): Promise<void> {
    const district = await this.districts.findOne({ where: { id } });
    if (!district) {
      throw new NotFoundException('District not found');
    }
    if (district.createdById !== userId) {
      throw new NotFoundException('District not found');
    }
    if (district.status !== ReviewStatus.PENDING) {
      throw new NotFoundException('Only pending submissions can be deleted');
    }
    await this.districts.delete(id);
  }
}
