import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  REPORT_REASONS,
  REPORT_TARGET_TYPES,
  type ReportReason,
  type ReportTargetType,
} from '../report.entity';

export class CreateReportDto {
  @IsIn(REPORT_TARGET_TYPES)
  targetType: ReportTargetType;

  @IsUUID()
  targetId: string;

  @IsIn(REPORT_REASONS)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}
