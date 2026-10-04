import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/jwt-payload.interface';
import { UserRole } from '../users/user.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { ReportStatus } from './report.entity';
import { ReportsService } from './reports.service';

/** In-app flagging that feeds the moderator review queue (LSA-F4). */
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** Guests may report too; the tight limit keeps that from becoming spam. */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  create(@Body() dto: CreateReportDto, @CurrentUser() user?: AuthUser) {
    return this.reports.create(dto, user?.id ?? null);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER)
  find(
    @Query('status', new ParseEnumPipe(ReportStatus, { optional: true }))
    status?: ReportStatus,
  ) {
    return this.reports.findByStatus(status ?? ReportStatus.OPEN);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER)
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reports.resolve(id, dto, user.id);
  }
}
