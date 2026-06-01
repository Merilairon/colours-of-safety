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
import { DistrictsService } from './districts.service';
import { CreateDistrictDto } from './dto/create-district.dto';

@Controller('districts')
export class DistrictsController {
  constructor(private readonly districts: DistrictsService) {}

  /** Public: only approved districts are visible to everyone. */
  @Get()
  findApproved() {
    return this.districts.findApproved();
  }

  /** Current user's own submissions (any status). */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: AuthUser) {
    return this.districts.findMine(user.id);
  }

  /** Reviewer queue: districts awaiting moderation. */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER)
  findPending() {
    return this.districts.findByStatus(ReviewStatus.PENDING);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateDistrictDto, @CurrentUser() user: AuthUser) {
    return this.districts.create(dto, user.id);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER)
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.districts.review(id, dto, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDistrictDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.districts.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.districts.delete(id, user.id);
  }
}
