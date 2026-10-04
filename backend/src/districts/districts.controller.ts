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
import { DistrictsService } from './districts.service';
import { CreateDistrictDto } from './dto/create-district.dto';

@Controller('districts')
export class DistrictsController {
  constructor(private readonly districts: DistrictsService) {}

  /** Public: only approved districts are visible to everyone. */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findApproved(@CurrentUser() viewer?: AuthUser) {
    return serializeSubmissions(await this.districts.findApproved(), viewer);
  }

  /** Current user's own submissions (any status). */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async findMine(@CurrentUser() user: AuthUser) {
    return serializeSubmissions(await this.districts.findMine(user.id), user);
  }

  /** Public: all pending districts visible to everyone while in review. */
  @Get('pending')
  @UseGuards(OptionalJwtAuthGuard)
  async findPending(@CurrentUser() viewer?: AuthUser) {
    return serializeSubmissions(
      await this.districts.findByStatus(ReviewStatus.PENDING),
      viewer,
    );
  }

  /**
   * Public for approved districts. Pending, rejected or banned districts are
   * only visible to their owner and moderators; everyone else gets a 404.
   * Declared after the literal `mine`/`pending` routes so those win.
   */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return serializeSubmission(
      await this.districts.findVisibleById(id, viewer),
      viewer,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateDistrictDto, @CurrentUser() user: AuthUser) {
    return serializeSubmission(await this.districts.create(dto, user.id), user);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER)
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return serializeSubmission(
      await this.districts.review(id, dto, user.id),
      user,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDistrictDto,
    @CurrentUser() user: AuthUser,
  ) {
    return serializeSubmission(
      await this.districts.update(id, dto, user.id),
      user,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.districts.delete(id, user.id, user.role);
  }
}
