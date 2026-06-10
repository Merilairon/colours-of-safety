import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Poi } from '../pois/poi.entity';
import { District } from '../districts/district.entity';
import { Vote, VoteTargetType } from './vote.entity';
import { ReviewStatus } from './review-status.enum';

export interface VoteResult {
  success: boolean;
  voteCount: number;
  autoApproved?: boolean;
}

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private readonly votes: Repository<Vote>,
    @InjectRepository(Poi)
    private readonly pois: Repository<Poi>,
    @InjectRepository(District)
    private readonly districts: Repository<District>,
  ) {}

  private hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  async voteOnPoi(
    poiId: string,
    userId: string | undefined,
    ip: string,
  ): Promise<VoteResult> {
    const poi = await this.pois.findOne({ where: { id: poiId } });
    if (!poi) {
      throw new NotFoundException('POI not found');
    }

    if (poi.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Can only vote on pending submissions');
    }

    return this.voteOnTarget(
      poiId,
      'poi',
      userId,
      ip,
      poi.voteCount || 0,
      true,
    );
  }

  async voteOnDistrict(
    districtId: string,
    userId: string | undefined,
    ip: string,
  ): Promise<VoteResult> {
    const district = await this.districts.findOne({
      where: { id: districtId },
    });
    if (!district) {
      throw new NotFoundException('District not found');
    }

    if (district.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Can only vote on pending submissions');
    }

    return this.voteOnTarget(
      districtId,
      'district',
      userId,
      ip,
      district.voteCount || 0,
      false,
    );
  }

  private async voteOnTarget(
    targetId: string,
    targetType: VoteTargetType,
    userId: string | undefined,
    ip: string,
    currentVoteCount: number,
    isPoi: boolean,
  ): Promise<VoteResult> {
    const ipHash = this.hashIp(ip);

    // Check for existing vote by user or IP
    const existingVote = await this.votes.findOne({
      where: userId
        ? [
            { targetId, targetType, userId },
            { targetId, targetType, ipHash },
          ]
        : { targetId, targetType, ipHash },
    });

    if (existingVote) {
      throw new BadRequestException('You have already voted on this item');
    }

    // Create vote
    const vote = this.votes.create({
      targetId,
      targetType,
      userId: userId ?? null,
      ipHash,
      value: 1,
    });
    await this.votes.save(vote);

    // Update vote count
    const newVoteCount = currentVoteCount + 1;

    // Check auto-approval threshold (default: 5)
    const threshold = parseInt(
      process.env.VOTE_AUTO_APPROVE_THRESHOLD || '5',
      10,
    );
    let autoApproved = false;

    if (newVoteCount >= threshold) {
      if (isPoi) {
        await this.pois.update(targetId, {
          voteCount: newVoteCount,
          status: ReviewStatus.APPROVED,
        });
      } else {
        await this.districts.update(targetId, {
          voteCount: newVoteCount,
          status: ReviewStatus.APPROVED,
        });
      }
      autoApproved = true;
    } else {
      if (isPoi) {
        await this.pois.update(targetId, { voteCount: newVoteCount });
      } else {
        await this.districts.update(targetId, { voteCount: newVoteCount });
      }
    }

    return {
      success: true,
      voteCount: newVoteCount,
      autoApproved,
    };
  }

  async hasVoted(
    targetId: string,
    targetType: VoteTargetType,
    userId: string | undefined,
    ip: string,
  ): Promise<boolean> {
    const ipHash = this.hashIp(ip);

    const existingVote = await this.votes.findOne({
      where: userId
        ? [
            { targetId, targetType, userId },
            { targetId, targetType, ipHash },
          ]
        : { targetId, targetType, ipHash },
    });

    return !!existingVote;
  }
}
