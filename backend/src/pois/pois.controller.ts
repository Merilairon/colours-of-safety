import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/jwt-payload.interface';
import {
  serializeSubmission,
  serializeSubmissions,
} from '../common/public-serializer';
import { ReviewDto } from '../common/review.dto';
import { ReviewStatus } from '../common/review-status.enum';
import { UserRole } from '../users/user.entity';
import { CreatePoiDto } from './dto/create-poi.dto';
import { PoisService } from './pois.service';

@Controller('pois')
export class PoisController {
  constructor(private readonly pois: PoisService) {}

  /** Public: only approved POIs are visible to everyone. */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findApproved(@CurrentUser() viewer?: AuthUser) {
    return serializeSubmissions(await this.pois.findApproved(), viewer);
  }

  /** Current user's own submissions (any status). */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async findMine(@CurrentUser() user: AuthUser) {
    return serializeSubmissions(await this.pois.findMine(user.id), user);
  }

  /** Public: all pending POIs visible to everyone while in review. */
  @Get('pending')
  @UseGuards(OptionalJwtAuthGuard)
  async findPending(@CurrentUser() viewer?: AuthUser) {
    return serializeSubmissions(
      await this.pois.findByStatus(ReviewStatus.PENDING),
      viewer,
    );
  }

  /**
   * Public for approved POIs. Pending, rejected or banned POIs are only
   * visible to their owner and moderators; everyone else gets a 404.
   * Declared after the literal `mine`/`pending` routes so those win.
   */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return serializeSubmission(
      await this.pois.findVisibleById(id, viewer),
      viewer,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async create(@Body() dto: CreatePoiDto, @CurrentUser() user: AuthUser) {
    return serializeSubmission(await this.pois.create(dto, user.id), user);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER)
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return serializeSubmission(await this.pois.review(id, dto, user.id), user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePoiDto,
    @CurrentUser() user: AuthUser,
  ) {
    return serializeSubmission(await this.pois.update(id, dto, user.id), user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pois.delete(id, user.id, user.role);
  }
}
