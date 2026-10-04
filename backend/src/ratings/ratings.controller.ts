import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthUser } from '../auth/jwt-payload.interface';
import { UpsertRatingDto } from './dto/upsert-rating.dto';
import { RatingsService } from './ratings.service';

/** Community ratings and short reviews on a published place (LSA-F5). */
@Controller('pois/:poiId/ratings')
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Param('poiId', ParseUUIDPipe) poiId: string,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.ratings.list(poiId, viewer);
  }

  /** Rates the place, or replaces the caller's earlier rating. */
  @Put('mine')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  upsert(
    @Param('poiId', ParseUUIDPipe) poiId: string,
    @Body() dto: UpsertRatingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ratings.upsert(poiId, dto, user);
  }

  @Delete(':ratingId')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  remove(
    @Param('poiId', ParseUUIDPipe) poiId: string,
    @Param('ratingId', ParseUUIDPipe) ratingId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ratings.remove(poiId, ratingId, user);
  }
}
