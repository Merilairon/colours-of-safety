import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReviewStatus } from './review-status.enum';

export class ReviewDto {
  @IsEnum([ReviewStatus.APPROVED, ReviewStatus.REJECTED])
  status: ReviewStatus.APPROVED | ReviewStatus.REJECTED;

  @IsOptional()
  @IsString()
  reviewNote?: string;
}
