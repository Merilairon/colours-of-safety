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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/jwt-payload.interface';
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
  findApproved() {
    return this.pois.findApproved();
  }

  /** Current user's own submissions (any status). */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: AuthUser) {
    return this.pois.findMine(user.id);
  }

  /** Reviewer queue: POIs awaiting moderation. */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER)
  findPending() {
    return this.pois.findByStatus(ReviewStatus.PENDING);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePoiDto, @CurrentUser() user: AuthUser) {
    return this.pois.create(dto, user.id);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER)
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pois.review(id, dto, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePoiDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pois.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pois.delete(id, user.id);
  }
}
