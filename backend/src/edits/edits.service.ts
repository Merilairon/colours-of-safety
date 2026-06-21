import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewDto } from '../common/review.dto';
import { ReviewStatus } from '../common/review-status.enum';
import { District } from '../districts/district.entity';
import { Poi } from '../pois/poi.entity';
import {
  EditProposal,
  EditProposalData,
  EditTargetType,
} from './edit-proposal.entity';

@Injectable()
export class EditsService {
  constructor(
    @InjectRepository(EditProposal)
    private readonly edits: Repository<EditProposal>,
    @InjectRepository(Poi)
    private readonly pois: Repository<Poi>,
    @InjectRepository(District)
    private readonly districts: Repository<District>,
  ) {}

  async create(
    dto: {
      targetType: EditTargetType;
      targetId: string;
      proposedData: EditProposalData;
    },
    userId: string,
  ): Promise<EditProposal> {
    const target = await this.findTarget(dto.targetType, dto.targetId);
    if (!target) {
      throw new NotFoundException('Target not found');
    }

    this.validateProposedData(dto.targetType, dto.proposedData);

    const originalData = this.snapshotTarget(dto.targetType, target);

    const proposal = this.edits.create({
      targetType: dto.targetType,
      targetId: dto.targetId,
      originalData,
      proposedData: dto.proposedData,
      status: ReviewStatus.PENDING,
      createdById: userId,
    });

    return this.edits.save(proposal);
  }

  findPending(): Promise<EditProposal[]> {
    return this.edits.find({
      where: { status: ReviewStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  findMine(userId: string): Promise<EditProposal[]> {
    return this.edits.find({
      where: { createdById: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async review(
    id: string,
    dto: ReviewDto,
    reviewerId: string,
  ): Promise<EditProposal> {
    const proposal = await this.edits.findOne({ where: { id } });
    if (!proposal) {
      throw new NotFoundException('Edit proposal not found');
    }
    if (proposal.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Edit proposal has already been reviewed');
    }

    if (dto.status === ReviewStatus.APPROVED) {
      await this.applyProposal(proposal);
    }

    await this.edits.update(id, {
      status: dto.status,
      reviewNote: dto.reviewNote ?? null,
      reviewedById: reviewerId,
    });

    return this.edits.findOneOrFail({ where: { id } });
  }

  private async findTarget(
    type: EditTargetType,
    id: string,
  ): Promise<Poi | District | null> {
    if (type === 'poi') {
      return this.pois.findOne({ where: { id } });
    }
    return this.districts.findOne({ where: { id } });
  }

  private snapshotTarget(
    type: EditTargetType,
    target: Poi | District,
  ): EditProposalData {
    if (type === 'poi') {
      const poi = target as Poi;
      return {
        name: poi.name,
        category: poi.category,
        description: poi.description,
        safetyRating: poi.safetyRating,
        wheelchairAccessible: poi.wheelchairAccessible,
        location: poi.location as {
          type: 'Point';
          coordinates: [number, number];
        },
      };
    }
    const district = target as District;
    return {
      name: district.name,
      description: district.description,
      safetyRating: district.safetyRating,
      wheelchairAccessible: district.wheelchairAccessible,
      area: district.area,
      blendEdges: district.blendEdges,
    };
  }

  private validateProposedData(
    type: EditTargetType,
    data: EditProposalData,
  ): void {
    if (
      data.safetyRating !== undefined &&
      (data.safetyRating < 1 || data.safetyRating > 5)
    ) {
      throw new BadRequestException('Safety rating must be between 1 and 5');
    }
    if (data.name !== undefined && data.name.length < 2) {
      throw new BadRequestException('Name must be at least 2 characters');
    }
    if (type === 'poi' && data.location !== undefined) {
      const coords = data.location.coordinates;
      if (!Array.isArray(coords) || coords.length !== 2) {
        throw new BadRequestException('Invalid location coordinates');
      }
    }
    if (type === 'district' && data.area !== undefined) {
      const rings = data.area.coordinates;
      if (!Array.isArray(rings) || rings.length === 0) {
        throw new BadRequestException('Invalid district area');
      }
    }
  }

  private async applyProposal(proposal: EditProposal): Promise<void> {
    const target = await this.findTarget(
      proposal.targetType,
      proposal.targetId,
    );
    if (!target) {
      throw new NotFoundException('Target no longer exists');
    }

    const { proposedData } = proposal;

    if (proposal.targetType === 'poi') {
      const poi = target as Poi;
      const update: Partial<Poi> = {};
      if (proposedData.name !== undefined) update.name = proposedData.name;
      if (proposedData.description !== undefined)
        update.description = proposedData.description;
      if (proposedData.category !== undefined)
        update.category = proposedData.category;
      if (proposedData.safetyRating !== undefined)
        update.safetyRating = proposedData.safetyRating;
      if (proposedData.wheelchairAccessible !== undefined) {
        update.wheelchairAccessible = proposedData.wheelchairAccessible;
      }
      if (proposedData.location !== undefined) {
        update.location = {
          type: 'Point',
          coordinates: proposedData.location.coordinates,
        };
      }
      await this.pois.update(poi.id, update);
    } else {
      const district = target as District;
      const update: Partial<District> = {};
      if (proposedData.name !== undefined) update.name = proposedData.name;
      if (proposedData.description !== undefined)
        update.description = proposedData.description;
      if (proposedData.safetyRating !== undefined)
        update.safetyRating = proposedData.safetyRating;
      if (proposedData.wheelchairAccessible !== undefined) {
        update.wheelchairAccessible = proposedData.wheelchairAccessible;
      }
      if (proposedData.area !== undefined) {
        update.area = {
          type: 'Polygon',
          coordinates: proposedData.area.coordinates,
        };
      }
      if (proposedData.blendEdges !== undefined)
        update.blendEdges = proposedData.blendEdges;
      await this.districts.update(district.id, update);
    }
  }
}
