import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  isModerator,
  PublicUser,
  toPublicUser,
  Viewer,
} from '../common/public-serializer';
import { ReviewStatus } from '../common/review-status.enum';
import { Poi } from '../pois/poi.entity';
import { UpsertRatingDto } from './dto/upsert-rating.dto';
import { PlaceRating } from './place-rating.entity';

export interface PublicRating {
  id: string;
  rating: number;
  comment: string;
  /** Null when the author chose to stay anonymous. */
  author: PublicUser | null;
  isAnonymous: boolean;
  isMine: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RatingSummary {
  ratingCount: number;
  communityRating: number | null;
}

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(PlaceRating)
    private readonly ratings: Repository<PlaceRating>,
    @InjectRepository(Poi)
    private readonly pois: Repository<Poi>,
  ) {}

  /** Ratings by non-banned users, newest first. Only for published places. */
  async list(poiId: string, viewer: Viewer): Promise<PublicRating[]> {
    await this.findPublishedPoi(poiId);
    const rows = await this.ratings
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.author', 'author')
      .where('r.poiId = :poiId', { poiId })
      .andWhere('author.banned = false')
      .orderBy('r.updatedAt', 'DESC')
      .getMany();
    return rows.map((r) => this.serialize(r, viewer));
  }

  /** Creates or replaces the viewer's rating and refreshes the place summary. */
  async upsert(
    poiId: string,
    dto: UpsertRatingDto,
    viewer: NonNullable<Viewer>,
  ): Promise<{ rating: PublicRating; summary: RatingSummary }> {
    const userId = viewer.id;
    await this.findPublishedPoi(poiId);
    const existing = await this.ratings.findOne({
      where: { poiId, authorId: userId },
    });
    const entity = this.ratings.merge(existing ?? this.ratings.create(), {
      poiId,
      authorId: userId,
      rating: dto.rating,
      comment: dto.comment?.trim() ?? '',
      isAnonymous: dto.isAnonymous ?? false,
    });
    const saved = await this.ratings.save(entity);
    const summary = await this.refreshSummary(poiId, true);
    const reloaded = await this.ratings.findOneOrFail({
      where: { id: saved.id },
    });
    return {
      rating: this.serialize(reloaded, viewer),
      summary,
    };
  }

  /** Authors can remove their own rating; moderators can remove any. */
  async remove(
    poiId: string,
    ratingId: string,
    viewer: NonNullable<Viewer>,
  ): Promise<RatingSummary> {
    const rating = await this.ratings.findOne({
      where: { id: ratingId, poiId },
    });
    if (!rating || (rating.authorId !== viewer.id && !isModerator(viewer))) {
      throw new NotFoundException('Rating not found');
    }
    await this.ratings.delete(rating.id);
    return this.refreshSummary(poiId, false);
  }

  /**
   * Recomputes the cached count and mean on the place. A new or changed
   * rating is a person confirming the place, so it also bumps lastVerifiedAt.
   */
  private async refreshSummary(
    poiId: string,
    verified: boolean,
  ): Promise<RatingSummary> {
    const row = await this.ratings
      .createQueryBuilder('r')
      .innerJoin('r.author', 'author')
      .select('COUNT(*)', 'count')
      .addSelect('AVG(r.rating)', 'avg')
      .where('r.poiId = :poiId', { poiId })
      .andWhere('author.banned = false')
      .getRawOne<{ count: string; avg: string | null }>();
    const summary: RatingSummary = {
      ratingCount: Number(row?.count ?? 0),
      communityRating:
        row?.avg != null ? Math.round(Number(row.avg) * 10) / 10 : null,
    };
    await this.pois.update(poiId, {
      ...summary,
      ...(verified ? { lastVerifiedAt: new Date() } : {}),
    });
    return summary;
  }

  private async findPublishedPoi(id: string): Promise<Poi> {
    const poi = await this.pois.findOne({
      where: { id, status: ReviewStatus.APPROVED, banned: false },
    });
    if (!poi) {
      throw new NotFoundException('Place not found');
    }
    return poi;
  }

  private serialize(rating: PlaceRating, viewer: Viewer): PublicRating {
    const isMine = !!viewer && viewer.id === rating.authorId;
    const hideAuthor = rating.isAnonymous && !isMine && !isModerator(viewer);
    return {
      id: rating.id,
      rating: rating.rating,
      comment: rating.comment,
      author: hideAuthor ? null : toPublicUser(rating.author),
      isAnonymous: rating.isAnonymous,
      isMine,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    };
  }
}
