import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportStatus } from '../report.entity';

export class ResolveReportDto {
  @IsIn([ReportStatus.RESOLVED, ReportStatus.DISMISSED])
  status: ReportStatus.RESOLVED | ReportStatus.DISMISSED;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
